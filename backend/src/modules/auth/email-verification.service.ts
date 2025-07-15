import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { User, UserDocument } from '../../shared/schemas/user.schema';

@Injectable()
export class EmailVerificationService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService
  ) {
    console.log('EMAIL_USER', this.configService.get('EMAIL_USER'));
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get('EMAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async enviarCodigoVerificacao(email: string): Promise<{
    success: boolean;
    message: string;
    codigo?: string; // Para desenvolvimento - remover em produção
  }> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.emailVerificado) {
      throw new BadRequestException('Email já foi verificado');
    }

    const codigo = this.generateVerificationCode();
    const expiracao = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await this.userModel
      .findByIdAndUpdate(user._id, {
        codigoVerificacaoEmail: codigo,
        expiracaoCodigoEmail: expiracao,
      })
      .exec();

    try {
      await this.enviarEmailVerificacao(email, codigo, user.nome);
    } catch (error) {
      const logger = new Logger(EmailVerificationService.name);
      logger.error('Erro detalhado ao enviar email:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        response: error.response,
        responseCode: error.responseCode,
        command: error.command,
      });
      throw new BadRequestException(`Erro ao enviar email de verificação: ${error.message}`);
    }

    return {
      success: true,
      message: 'Código de verificação enviado para seu email',
      codigo: this.configService.get('NODE_ENV') === 'development' ? codigo : undefined,
    };
  }

  private async enviarEmailVerificacao(email: string, codigo: string, nome: string): Promise<void> {
    const logger = new Logger(EmailVerificationService.name);

    const mailOptions = {
      from: this.configService.get('EMAIL_FROM', 'oliveroliveira222@gmail.com'),
      to: email,
      subject: 'Verificação de Email - QuadraFC',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Olá, ${nome}!</h2>
          <p>Obrigado por se cadastrar no QuadraFC!</p>
          <p>Para completar seu cadastro, use o código de verificação abaixo:</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${codigo}</h1>
          </div>
          <p>Este código expira em 10 minutos.</p>
          <p>Se você não solicitou este cadastro, ignore este email.</p>
          <hr>
          <p style="color: #6c757d; font-size: 12px;">QuadraFC - Seu app de futebol</p>
        </div>
      `,
    };

    logger.debug('Configurações SMTP:', {
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: this.configService.get('EMAIL_PORT') === '465',
      user: this.configService.get('EMAIL_USER'),
      from: this.configService.get('EMAIL_FROM', 'oliveroliveira222@gmail.com'),
      to: email,
    });

    try {
      logger.debug('Enviando email...');
      const result = await this.transporter.sendMail(mailOptions);
      logger.debug('Email enviado com sucesso:', result);
    } catch (error) {
      logger.error('Erro no nodemailer:', {
        message: error.message,
        code: error.code,
        response: error.response,
        responseCode: error.responseCode,
        command: error.command,
        stack: error.stack,
      });
      throw error;
    }
  }

  async verificarCodigo(
    email: string,
    codigo: string
  ): Promise<{
    success: boolean;
    message: string;
    emailVerificado: boolean;
  }> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.emailVerificado) {
      return {
        success: true,
        message: 'Email já foi verificado',
        emailVerificado: true,
      };
    }

    if (!user.codigoVerificacaoEmail || !user.expiracaoCodigoEmail) {
      throw new BadRequestException('Nenhum código de verificação foi enviado');
    }

    if (new Date() > user.expiracaoCodigoEmail) {
      throw new BadRequestException('Código de verificação expirado');
    }

    if (user.codigoVerificacaoEmail !== codigo) {
      throw new BadRequestException('Código de verificação inválido');
    }

    // Verificar email e ativar usuário
    await this.userModel
      .findByIdAndUpdate(user._id, {
        emailVerificado: true,
        ativo: true,
        codigoVerificacaoEmail: null,
        expiracaoCodigoEmail: null,
      })
      .exec();

    return {
      success: true,
      message: 'Email verificado com sucesso!',
      emailVerificado: true,
    };
  }

  async reenviarCodigo(email: string): Promise<{
    success: boolean;
    message: string;
    codigo?: string; // Para desenvolvimento
  }> {
    return this.enviarCodigoVerificacao(email);
  }

  async verificarStatusEmail(email: string): Promise<{
    emailVerificado: boolean;
    temCodigoPendente: boolean;
    codigoExpirado: boolean;
  }> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const temCodigoPendente = !!(user.codigoVerificacaoEmail && user.expiracaoCodigoEmail);
    const codigoExpirado = temCodigoPendente && new Date() > user.expiracaoCodigoEmail;

    return {
      emailVerificado: user.emailVerificado,
      temCodigoPendente: temCodigoPendente && !codigoExpirado,
      codigoExpirado,
    };
  }
}
