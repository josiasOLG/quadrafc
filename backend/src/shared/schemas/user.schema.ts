import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

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

  @ApiProperty({ description: 'ID do bairro', required: false })
  @Prop({ type: Types.ObjectId, ref: 'Bairro', required: false }) // Agora é opcional - será preenchido no onboarding
  bairroId?: Types.ObjectId;

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

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
