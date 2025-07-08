import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { UsersService } from '../../modules/auth/../users/users.service';
import { SessionService } from '../../modules/auth/session.service';

@Injectable()
export class SessionRefreshInterceptor implements NestInterceptor {
  constructor(
    private sessionService: SessionService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Se for um erro 401 (Unauthorized), tentar renovar a sessão
        if (error instanceof UnauthorizedException) {
          return from(this.tryRefreshSession(context)).pipe(
            switchMap((refreshed) => {
              if (refreshed) {
                // Se conseguiu renovar, tentar novamente a requisição original
                return next.handle();
              } else {
                // Se não conseguiu renovar, retorna o erro original
                return throwError(() => error);
              }
            }),
            catchError(() => throwError(() => error))
          );
        }

        // Para outros erros, apenas repassa
        return throwError(() => error);
      })
    );
  }

  private async tryRefreshSession(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>();
      const response = context.switchToHttp().getResponse<Response>();

      // Verificar se existe session_token nos cookies
      const sessionToken = request.cookies?.session_token;
      if (!sessionToken) {
        return false;
      }

      // Verificar se a sessão ainda existe no banco (pode estar expirada no JWT mas válida no banco)
      const session = await this.sessionService.findSessionByToken(sessionToken);
      if (!session || !session.isActive) {
        return false;
      }

      // Verificar se a sessão não está expirada
      if (session.expiresAt < new Date()) {
        return false;
      }

      // Buscar usuário
      const user = await this.usersService.findById(session.userId.toString());
      if (!user) {
        return false;
      }

      // Gerar novo JWT
      const payload = { email: user.email, sub: user._id };
      const newJwtToken = this.jwtService.sign(payload);

      // Atualizar cookies com novo JWT
      response.cookie('token', newJwtToken, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        path: '/',
      });

      // Atualizar a última atividade da sessão
      await this.sessionService.updateSessionActivity(sessionToken);

      // Atualizar o request com o novo usuário para evitar outros 401s na mesma requisição
      request.user = { _id: user._id.toString(), sub: user._id.toString() };

      return true;
    } catch (error) {
      console.error('Erro ao tentar renovar sessão:', error);
      return false;
    }
  }
}
