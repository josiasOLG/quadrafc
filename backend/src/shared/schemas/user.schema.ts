import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: 'Nome do usuário' })
  @Prop({ required: true })
  nome: string; // Mudado de 'name' para 'nome'

  @ApiProperty({ description: 'Email do usuário' })
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @ApiProperty({ description: 'Código único do usuário gerado no registro' })
  @Prop({ required: true, unique: true })
  code: string;

  @ApiProperty({ description: 'Data de nascimento', required: false })
  @Prop({ required: false })
  data_nascimento?: Date;

  @ApiProperty({ description: 'Telefone do usuário', required: false })
  @Prop({ required: false })
  telefone?: string;

  @ApiProperty({ description: 'Cidade do usuário', required: false })
  @Prop({ required: false }) // Agora é opcional - será preenchido no onboarding
  cidade?: string;

  @ApiProperty({ description: 'Estado do usuário', required: false })
  @Prop({ required: false }) // Agora é opcional - será preenchido no onboarding
  estado?: string;

  @ApiProperty({ description: 'País do usuário', required: false })
  @Prop({ required: false, default: 'Brasil' })
  pais?: string;

  @ApiProperty({ description: 'CEP do usuário', required: false })
  @Prop({ required: false })
  cep?: string;

  @ApiProperty({ description: 'Nome do bairro', required: false })
  @Prop({ required: false })
  bairro?: string;

  @ApiProperty({ description: 'URL do avatar' })
  @Prop({ default: '' })
  avatarUrl: string;

  @ApiProperty({ description: 'Quantidade de moedas virtuais' })
  @Prop({ default: 0 })
  moedas: number;

  @ApiProperty({ description: 'Total de pontos acumulados' })
  @Prop({ default: 0 })
  totalPoints: number;

  @ApiProperty({ description: 'Medalhas conquistadas' })
  @Prop({ type: [String], default: [] })
  medals: string[];

  @ApiProperty({ description: 'Se o usuário é administrador' })
  @Prop({ default: false })
  isAdmin: boolean;

  @ApiProperty({ description: 'Roles/permissões do usuário' })
  @Prop({ type: [String], default: [] })
  roles: string[];

  @ApiProperty({ description: 'Se tem assinatura premium vitalícia' })
  @Prop({ default: false })
  assinaturaPremium: boolean;

  @ApiProperty({ description: 'Data de vencimento da assinatura premium' })
  @Prop({ required: false })
  dataVencimentoPremium?: Date;

  @ApiProperty({ description: 'Limite de palpites por dia para este usuário' })
  @Prop({ default: 5 })
  limitePalpitesDia: number;

  @ApiProperty({ description: 'Contador de palpites feitos hoje' })
  @Prop({ default: 0 })
  palpitesHoje: number;

  @ApiProperty({ description: 'Contagem de links compartilhados pelo usuário' })
  @Prop({ default: 0 })
  contagemCompartilhamentos: number;

  @ApiProperty({ description: 'Data do último reset do contador de palpites' })
  @Prop({ default: Date.now })
  ultimoResetPalpites: Date;

  @ApiProperty({ description: 'Se o perfil é público ou privado' })
  @Prop({ default: true })
  isPublicProfile: boolean;

  @ApiProperty({ description: 'Campeonatos favoritos do usuário' })
  @Prop({ type: [String], default: [] })
  campeonatos: string[];

  @ApiProperty({ description: 'Se o email foi verificado' })
  @Prop({ default: false })
  emailVerificado: boolean;

  @ApiProperty({ description: 'Código de verificação de email', required: false })
  @Prop({ required: false })
  codigoVerificacaoEmail?: string;

  @ApiProperty({ description: 'Data de expiração do código de verificação', required: false })
  @Prop({ required: false })
  expiracaoCodigoEmail?: Date;

  @ApiProperty({ description: 'Se o usuário está ativo (email verificado)' })
  @Prop({ default: false })
  ativo: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
