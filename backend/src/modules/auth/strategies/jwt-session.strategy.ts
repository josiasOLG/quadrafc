import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtSessionStrategy extends PassportStrategy(Strategy, 'jwt-session') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Primeiro tentar session_token
          const sessionToken = request?.cookies?.session_token;
          if (sessionToken) {
            return null; // Será processado no validate
          }
          // Depois tentar JWT normal
          return request?.cookies?.token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    // Primeiro verificar session token
    const sessionToken = request?.cookies?.session_token;
    if (sessionToken) {
      const userId = await this.authService.validateSessionToken(sessionToken);
      if (userId) {
        return { _id: userId, sub: userId };
      }
    }

    // Se não tem session token válido, tentar JWT
    if (payload && payload.sub) {
      return { _id: payload.sub, sub: payload.sub };
    }

    throw new UnauthorizedException('Token inválido');
  }
}
