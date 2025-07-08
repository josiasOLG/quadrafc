import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { LoginDto } from '../../shared/dto/login.dto';
import { RegisterDto } from '../../shared/dto/register.dto';
import { BairrosService } from '../bairros/bairros.service';
import { UsersService } from '../users/users.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private bairrosService: BairrosService,
    private sessionService: SessionService
  ) {}

  async register(registerDto: RegisterDto, response: Response) {
    // Verificar se usuário já existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Criar usuário
    const user = await this.usersService.create(registerDto);

    // Gerar JWT
    const payload = { email: user.email, sub: user._id };
    const token = this.jwtService.sign(payload, {
      expiresIn: '30d', // 30 dias
    });

    // Salvar token na tabela usersessions
    const deviceInfo = 'Web Browser'; // Default para registro
    const ipAddress = '127.0.0.1'; // Default para registro
    const userAgent = 'Web Browser';

    await this.sessionService.createOrUpdateSessionWithToken(
      user._id.toString(),
      deviceInfo,
      ipAddress,
      userAgent,
      token
    );

    // Remover senha do retorno
    const { passwordHash, ...result } = user.toObject();
    return {
      user: result,
      access_token: token,
      message: 'Cadastro realizado com sucesso',
    };
  }

  async login(loginDto: LoginDto, response: Response, request?: any) {
    // Validar usuário
    const user = await this.usersService.findByEmail(loginDto.email);
    if (
      !user ||
      !(await this.usersService.validatePassword(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Extrair informações do request
    const deviceInfo = this.getDeviceInfo(request);
    const ipAddress = this.getClientIP(request);
    const userAgent = request?.headers?.['user-agent'] || 'Unknown';

    // Gerar JWT token
    const payload = { email: user.email, sub: user._id };
    const jwtToken = this.jwtService.sign(payload, {
      expiresIn: '30d', // 30 dias
    });

    // Salvar token na tabela usersessions
    await this.sessionService.createOrUpdateSessionWithToken(
      user._id.toString(),
      deviceInfo,
      ipAddress,
      userAgent,
      jwtToken
    );

    // Remover senha do retorno
    const { passwordHash, ...result } = user.toObject();
    return {
      user: result,
      access_token: jwtToken,
      message: 'Login realizado com sucesso',
    };
  }

  async logout(response: Response, request?: any) {
    // Obter token do header Authorization
    const authHeader = request?.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      // Invalidar sessão no banco usando o JWT token
      await this.sessionService.invalidateSession(token);
    }

    return { message: 'Logout realizado com sucesso' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Remover senha do retorno
    const { passwordHash, ...result } = user.toObject();

    return result;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await this.usersService.validatePassword(password, user.passwordHash))) {
      const { passwordHash, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async updateProfile(userId: string, updateData: any) {
    // Se o bairro foi enviado junto com cidade, estado, etc., processá-lo
    if (updateData.bairro && updateData.cidade && updateData.estado) {
      // Encontrar ou criar o bairro
      const bairro = await this.bairrosService.findOrCreate({
        nome: updateData.bairro,
        cidade: updateData.cidade,
        estado: updateData.estado,
        pais: updateData.pais || 'Brasil',
        cep: updateData.cep,
      });

      // Atualizar dados do usuário com o ID do bairro
      updateData.bairroId = (bairro as any)._id;
    } else if (updateData.bairro) {
      // Compatibilidade com fluxo antigo
      updateData.bairroId = updateData.bairro;
      delete updateData.bairro;
    }

    const user = await this.usersService.updateProfile(userId, updateData);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Remover senha do retorno e adicionar campo bairro para compatibilidade com frontend
    const { passwordHash, ...result } = user.toObject();

    // Se tem bairroId populado, adicionar o campo bairro
    if (result.bairroId) {
      result.bairro = result.bairroId._id || result.bairroId;
    }

    return result;
  }

  async refreshToken(userId: string): Promise<{ access_token: string }> {
    // Buscar usuário
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Gerar novo JWT token
    const payload = { email: user.email, sub: user._id };
    const newToken = this.jwtService.sign(payload, {
      expiresIn: '30d', // 30 dias
    });

    // Atualizar token na tabela usersessions
    await this.sessionService.updateSessionToken(userId, newToken);

    return {
      access_token: newToken,
    };
  }

  // Métodos auxiliares para sessões
  private getDeviceInfo(request: any): string {
    const userAgent = request?.headers?.['user-agent'] || '';

    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';

    return 'Unknown Device';
  }

  private getClientIP(request: any): string {
    return (
      request?.ip ||
      request?.connection?.remoteAddress ||
      request?.socket?.remoteAddress ||
      request?.headers?.['x-forwarded-for']?.split(',')[0] ||
      'Unknown IP'
    );
  }

  async validateSessionToken(sessionToken: string): Promise<string | null> {
    return await this.sessionService.validateSession(sessionToken);
  }
}
