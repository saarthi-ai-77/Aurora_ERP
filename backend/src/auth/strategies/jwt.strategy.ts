import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: (req: any) => {
        let token = null;
        if (req && req.query && req.query['token']) {
          token = req.query['token'];
        }
        if (!token && req && req.cookies) {
          token = req.cookies['accessToken'];
        }
        return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role,
      studentProfileId: payload.studentProfileId,
      facultyProfileId: payload.facultyProfileId,
      adminProfileId: payload.adminProfileId,
    };
  }
}
