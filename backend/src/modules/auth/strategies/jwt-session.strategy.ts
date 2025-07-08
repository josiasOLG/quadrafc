import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../../modules/users/users.service';
import { AuthService } from '../auth.service';
import { SessionService } from '../session.service';

@Injectable()
export class JwtSessionStrategy extends PassportStrategy(Strategy, 'jwt-session') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private sessionService: SessionService,
    private usersService: UsersService
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
    // Primeiro verificar session token (prioridade máxima)
    const sessionToken = request?.cookies?.session_token;
    if (sessionToken) {
      const userId = await this.authService.validateSessionToken(sessionToken);
      if (userId) {
        return { _id: userId, sub: userId };
      }

      // Se session token existe mas é inválido, tentar renovar
      const renewed = await this.tryRenewSession(request, sessionToken);
      if (renewed) {
        return renewed;
      }
    }

    // Se não tem session token válido, tentar JWT
    if (payload && payload.sub) {
      return { _id: payload.sub, sub: payload.sub };
    }

    // Se nenhum dos dois funcionou, lançar erro
    throw new UnauthorizedException('Token inválido');
  }

  private async tryRenewSession(request: Request, sessionToken: string): Promise<any | null> {
    try {
      // Verificar se a sessão ainda existe no banco
      const session = await this.sessionService.findSessionByToken(sessionToken);
      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return null;
      }

      // Buscar usuário
      const user = await this.usersService.findById(session.userId.toString());
      if (!user) {
        return null;
      }

      // Atualizar última atividade da sessão
      await this.sessionService.updateSessionActivity(sessionToken);

      return { _id: user._id.toString(), sub: user._id.toString() };
    } catch (error) {
      console.error('Erro ao renovar sessão:', error);
      return null;
    }
  }
}
