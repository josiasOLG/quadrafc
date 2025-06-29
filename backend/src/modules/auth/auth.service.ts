import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from '../../shared/dto/register.dto';
import { LoginDto } from '../../shared/dto/login.dto';
import { UserDocument } from '../../shared/schemas/user.schema';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });
    
    // Remover senha do retorno
    const { passwordHash, ...result } = user.toObject();
    return {
      user: result,
      message: 'Cadastro realizado com sucesso'
    };
  }

  async login(loginDto: LoginDto, response: Response) {
    // Validar usuário
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !(await this.usersService.validatePassword(loginDto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar JWT
    const payload = { email: user.email, sub: user._id };
    const token = this.jwtService.sign(payload);

    // Configurar cookie httpOnly
    response.cookie('token', token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    // Remover senha do retorno
    const { passwordHash, ...result } = user.toObject();
    return {
      user: result,
      message: 'Login realizado com sucesso'
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

    // Remover senha do retorno e adicionar campo bairro para compatibilidade com frontend
    const { passwordHash, ...result } = user.toObject();
    
    // Se tem bairroId populado, adicionar o campo bairro
    if (result.bairroId) {
      result.bairro = result.bairroId._id || result.bairroId;
    }
    
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
    // Se o bairro foi enviado, convertê-lo para bairroId
    if (updateData.bairro) {
      updateData.bairroId = updateData.bairro;
      delete updateData.bairro;
    }

    const user = await this.usersService.updateProfile(userId, updateData);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Remover senha do retorno e adicionar campo bairro para compatibilidade com frontend
    const { passwordHash, ...result } = user.toObject();
    
    // Se tem bairroId populado, adicionar o campo bairro
    if (result.bairroId) {
      result.bairro = result.bairroId._id || result.bairroId;
    }
    
    return result;
  }
}
