import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) { }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        studentProfile: { select: { id: true, firstName: true, lastName: true } },
        facultyProfile: { select: { id: true, firstName: true, lastName: true } },
        adminProfile: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Generic error: do not reveal whether email exists
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Brute-force: check lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockoutUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : undefined,
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Successful auth: reset brute-force counters
    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockoutUntil: null },
      });
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    const hashedRefresh = await argon2.hash(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: hashedRefresh,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    let profileName = '';
    if (user.studentProfile) {
      profileName = `${user.studentProfile.firstName} ${user.studentProfile.lastName}`;
    } else if (user.facultyProfile) {
      profileName = `${user.facultyProfile.firstName} ${user.facultyProfile.lastName}`;
    } else if (user.adminProfile) {
      profileName = `${user.adminProfile.firstName} ${user.adminProfile.lastName}`;
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: profileName,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userId = payload.sub;

    const userTokens = await this.prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    let validToken = null;
    for (const t of userTokens) {
      const match = await argon2.verify(t.token, refreshToken);
      if (match) {
        validToken = t;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: validToken.id } });

    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
      validToken.user.id,
      validToken.user.email,
      validToken.user.role,
    );

    const hashedRefresh = await argon2.hash(newRefreshToken);
    await this.prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: hashedRefresh,
        userId: validToken.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        studentProfile: { select: { id: true, firstName: true, lastName: true } },
        facultyProfile: { select: { id: true, firstName: true, lastName: true } },
        adminProfile: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    let profileName = '';
    if (user.studentProfile) {
      profileName = `${user.studentProfile.firstName} ${user.studentProfile.lastName}`;
    } else if (user.facultyProfile) {
      profileName = `${user.facultyProfile.firstName} ${user.facultyProfile.lastName}`;
    } else if (user.adminProfile) {
      profileName = `${user.adminProfile.firstName} ${user.adminProfile.lastName}`;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: profileName,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!currentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const isSamePassword = await argon2.verify(user.passwordHash, dto.newPassword);
    if (isSamePassword) {
      throw new BadRequestException('New password must differ from your current password');
    }

    const newHash = await argon2.hash(dto.newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });
      // Invalidate all refresh tokens so other sessions are terminated
      await tx.refreshToken.deleteMany({ where: { userId } });
    });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        studentProfile: { select: { id: true } },
        facultyProfile: { select: { id: true } },
        adminProfile: { select: { id: true } },
      },
    });

    const payload = {
      sub: userId,
      email,
      role,
      studentProfileId: user?.studentProfile?.id,
      facultyProfileId: user?.facultyProfile?.id,
      adminProfileId: user?.adminProfile?.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRY') || '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRY') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
