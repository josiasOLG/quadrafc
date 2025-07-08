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

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private bairrosService: BairrosService
  ) {}

  async register(registerDto: RegisterDto, response: Response) {
    // Verificar se usuário já existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Criar usuário
    const user = await this.usersService.create(registerDto);

    // Gerar JWT para login automático após registro
    const payload = { email: user.email, sub: user._id };
    const token = this.jwtService.sign(payload);

    // Configurar cookie httpOnly
    response.cookie('token', token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      // Não definir domain para permitir cookies entre subdomínios do Vercel
    });

    // Remover senha do retorno
    const { passwordHash, ...result } = user.toObject();
    return {
      user: result,
      message: 'Cadastro realizado com sucesso',
    };
  }

  async login(loginDto: LoginDto, response: Response) {
    // Validar usuário
    const user = await this.usersService.findByEmail(loginDto.email);
    if (
      !user ||
      !(await this.usersService.validatePassword(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar JWT
    const payload = { email: user.email, sub: user._id };
    const token = this.jwtService.sign(payload);

    // Configurar cookie httpOnly
    response.cookie('token', token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      // Não definir domain para permitir cookies entre subdomínios do Vercel
    });

    // Remover senha do retorno
    const { passwordHash, ...result } = user.toObject();
    return {
      user: result,
      message: 'Login realizado com sucesso',
    };
  }

  async logout(response: Response) {
    response.clearCookie('token');
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

  async refreshToken(userId: string, response: Response) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Gerar novo JWT
    const payload = { email: user.email, sub: user._id };
    const token = this.jwtService.sign(payload);

    // Configurar novo cookie httpOnly
    response.cookie('token', token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      // Não definir domain para permitir cookies entre subdomínios do Vercel
    });

    // Remover senha do retorno
    const { passwordHash, ...result } = user.toObject();
    return {
      user: result,
      message: 'Token renovado com sucesso',
      timestamp: new Date().toISOString(),
    };
  }
}
