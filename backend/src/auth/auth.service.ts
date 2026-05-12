import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: {
          studentProfile: true,
          facultyProfile: true,
          adminProfile: true,
        },
      });

      console.log(`[AUTH] Login attempt for: ${dto.email}`);
      if (!user || !user.isActive) {
        console.log(`[AUTH] User not found or inactive: ${dto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordValid = await argon2.verify(user.passwordHash, dto.password);
      console.log(`[AUTH] Password valid: ${passwordValid}`);
      if (!passwordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const { accessToken, refreshToken } = await this.generateTokens(
        user.id,
        user.email,
        user.role,
      );

      // Store hashed refresh token
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
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshTokens(refreshToken: string) {
    const allTokens = await this.prisma.refreshToken.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    let validToken = null;
    for (const t of allTokens) {
      const match = await argon2.verify(t.token, refreshToken);
      if (match) {
        validToken = t;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: delete old, create new
    await this.prisma.refreshToken.delete({ where: { id: validToken.id } });

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(
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
      include: {
        studentProfile: true,
        facultyProfile: true,
        adminProfile: true,
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

  private async generateTokens(userId: string, email: string, role: string) {
    // Fetch profile IDs to include in token for fast operational lookup
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: { select: { id: true } },
        facultyProfile: { select: { id: true } },
        adminProfile: { select: { id: true } },
      }
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
