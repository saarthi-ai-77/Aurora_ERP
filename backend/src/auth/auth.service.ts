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
    // --- MOCK LOGIN BYPASS ---
    if (dto.password === 'password123') {
      let role: any = null;
      let profileName = '';
      const email = dto.email.toLowerCase().trim();

      if (email === 'admin@aurora.ac.in') { role = 'ADMIN'; profileName = 'System Administrator'; }
      if (email === 'faculty@aurora.ac.in') { role = 'FACULTY'; profileName = 'Sai Rahul Mallidi'; }
      if (email === 'student@aurora.ac.in') { role = 'STUDENT'; profileName = 'Nikshith Yadagiri'; }

      if (role) {
        const { accessToken, refreshToken } = await this.generateTokens('mock-id', dto.email, role);
        try {
          const hashedRefresh = await argon2.hash(refreshToken);
          await this.prisma.refreshToken.create({
            data: {
              id: uuidv4(),
              token: hashedRefresh,
              userId: 'mock-id',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        } catch (e) {
          // Ignore DB connection errors for mock logins so the UI can be tested
          console.log("Mock login: DB not connected, skipping refresh token storage.");
        }
        return {
          accessToken,
          refreshToken,
          user: { id: 'mock-id', email: dto.email, role, name: profileName },
        };
      }
    }
    // --- END MOCK LOGIN BYPASS ---

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: {
          studentProfile: true,
          facultyProfile: true,
          adminProfile: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordValid = await argon2.verify(user.passwordHash, dto.password);
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

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

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
