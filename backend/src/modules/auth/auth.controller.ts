import { Controller, Post, Body, Res, HttpCode, HttpStatus, Get, Request, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from '../../shared/dto/register.dto';
import { LoginDto } from '../../shared/dto/login.dto';
import { Public } from '../../shared/decorators/public.decorator';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ResponseMessage('Usuário registrado com sucesso')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.authService.register(registerDto, response);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login realizado com sucesso')
  @ApiOperation({ summary: 'Fazer login' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(loginDto, response);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logout realizado com sucesso')
  @ApiOperation({ summary: 'Fazer logout' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ResponseMessage('Perfil do usuário obtido com sucesso')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil obtido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user._id || req.user.sub);
  }

  @Put('profile')
  @ApiBearerAuth()
  @ResponseMessage('Perfil atualizado com sucesso')
  @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.authService.updateProfile(req.user._id || req.user.sub, updateData);
  }
}
