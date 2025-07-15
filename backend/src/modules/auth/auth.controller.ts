import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Request,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../shared/decorators/public.decorator';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import {
  EnviarCodigoEmailDto,
  VerificarCodigoEmailDto,
} from '../../shared/dto/email-verification.dto';
import { LoginDto } from '../../shared/dto/login.dto';
import { RegisterDto } from '../../shared/dto/register.dto';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService
  ) {}

  @Post('register')
  @Public()
  @ResponseMessage('Usuário registrado com sucesso')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) response: Response) {
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
    @Request() req
  ) {
    return this.authService.login(loginDto, response, req);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logout realizado com sucesso')
  @ApiOperation({ summary: 'Fazer logout' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@Res({ passthrough: true }) response: Response, @Request() req) {
    return this.authService.logout(response, req);
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

  @Get('validate-session')
  @ApiBearerAuth()
  @ResponseMessage('Sessão validada com sucesso')
  @ApiOperation({ summary: 'Validar sessão atual' })
  @ApiResponse({ status: 200, description: 'Sessão válida' })
  @ApiResponse({ status: 401, description: 'Sessão inválida' })
  async validateSession(@Request() req) {
    const user = await this.authService.getProfile(req.user._id || req.user.sub);
    return {
      valid: true,
      user,
      timestamp: new Date().toISOString(),
    };
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token renovado com sucesso')
  @ApiOperation({ summary: 'Renovar token de autenticação' })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user._id || req.user.sub);
  }

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Sessão válida')
  @ApiOperation({ summary: 'Verificar se a sessão está ativa' })
  @ApiResponse({ status: 200, description: 'Sessão válida' })
  @ApiResponse({ status: 401, description: 'Sessão inválida' })
  async ping(@Request() req) {
    return {
      valid: true,
      userId: req.user._id || req.user.sub,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Dados do usuário obtidos com sucesso')
  @ApiOperation({ summary: 'Obter dados básicos do usuário autenticado (alias para profile)' })
  @ApiResponse({ status: 200, description: 'Dados obtidos com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getMe(@Request() req) {
    return this.authService.getProfile(req.user._id || req.user.sub);
  }

  @Post('enviar-codigo-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Código de verificação enviado')
  @ApiOperation({ summary: 'Enviar código de verificação para email' })
  @ApiResponse({ status: 200, description: 'Código enviado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 400, description: 'Email já verificado' })
  async enviarCodigoEmail(@Body() enviarCodigoDto: EnviarCodigoEmailDto) {
    return this.emailVerificationService.enviarCodigoVerificacao(enviarCodigoDto.email);
  }

  @Post('verificar-codigo-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Email verificado com sucesso')
  @ApiOperation({ summary: 'Verificar código de validação do email' })
  @ApiResponse({ status: 200, description: 'Email verificado com sucesso' })
  @ApiResponse({ status: 400, description: 'Código inválido ou expirado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async verificarCodigoEmail(@Body() verificarCodigoDto: VerificarCodigoEmailDto) {
    return this.emailVerificationService.verificarCodigo(
      verificarCodigoDto.email,
      verificarCodigoDto.codigo
    );
  }

  @Post('reenviar-codigo-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Código reenviado com sucesso')
  @ApiOperation({ summary: 'Reenviar código de verificação para email' })
  @ApiResponse({ status: 200, description: 'Código reenviado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 400, description: 'Email já verificado' })
  async reenviarCodigoEmail(@Body() enviarCodigoDto: EnviarCodigoEmailDto) {
    return this.emailVerificationService.reenviarCodigo(enviarCodigoDto.email);
  }

  @Post('status-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Status do email obtido com sucesso')
  @ApiOperation({ summary: 'Verificar status de verificação do email' })
  @ApiResponse({ status: 200, description: 'Status obtido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async statusEmail(@Body() statusDto: EnviarCodigoEmailDto) {
    return this.emailVerificationService.verificarStatusEmail(statusDto.email);
  }
}
