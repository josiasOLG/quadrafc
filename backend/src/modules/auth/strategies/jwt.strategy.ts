import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { SessionService } from '../session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private sessionService: SessionService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true, // Para acessar o request no validate
    });
  }

  async validate(request: any, payload: any) {
    // Extrair o token JWT da requisição usando método padrão
    const authHeader = request.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    console.log('🔍 JWT Strategy - Token recebido:', token ? 'Token presente' : 'Token ausente');
    console.log('🔍 JWT Strategy - Payload:', payload);

    if (!token) {
      console.error('❌ JWT Strategy - Token não fornecido');
      throw new UnauthorizedException('Token não fornecido');
    }

    // Verificar se o token existe na tabela usersessions e está ativo
    const userId = await this.sessionService.validateSession(token);
    console.log('🔍 JWT Strategy - UserId da sessão:', userId);

    if (!userId) {
      console.error('❌ JWT Strategy - Sessão não encontrada na tabela para token');
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    // Buscar usuário
    const user = await this.usersService.findById(payload.sub);
    console.log('🔍 JWT Strategy - Usuário encontrado:', user ? user.email : 'Não encontrado');

    if (!user || user._id.toString() !== userId) {
      console.error('❌ JWT Strategy - Usuário inválido ou ID não confere');
      console.error('❌ JWT Strategy - User ID do payload:', payload.sub);
      console.error('❌ JWT Strategy - User ID da sessão:', userId);
      throw new UnauthorizedException('Token inválido');
    }

    console.log('✅ JWT Strategy - Validação bem-sucedida para:', user.email);
    return user;
  }
}
