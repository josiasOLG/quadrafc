import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type UserAcessoPremiumDocument = UserAcessoPremium & Document;

export enum TipoAcesso {
  CIDADE = 'cidade',
  ESTADO = 'estado',
  NACIONAL = 'nacional',
}

@Schema({ timestamps: true })
export class UserAcessoPremium {
  @ApiProperty({ description: 'ID do usuário' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Tipo de acesso: cidade, estado, nacional' })
  @Prop({ required: true, enum: Object.values(TipoAcesso), index: true })
  tipoAcesso: TipoAcesso;

  @ApiProperty({ description: 'Estado específico (para acesso estadual/cidade)', required: false })
  @Prop({ required: false, index: true })
  estado?: string;

  @ApiProperty({ description: 'Cidade específica (para acesso à cidade)', required: false })
  @Prop({ required: false, index: true })
  cidade?: string;

  @ApiProperty({ description: 'Custo pago em moedas' })
  @Prop({ required: true, min: 0 })
  custoMoedas: number;

  @ApiProperty({ description: 'Data de expiração do acesso', required: false })
  @Prop({ required: false })
  dataExpiracao?: Date;

  @ApiProperty({ description: 'Se o acesso está ativo' })
  @Prop({ default: true, index: true })
  ativo: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export const UserAcessoPremiumSchema = SchemaFactory.createForClass(UserAcessoPremium);

// Índices compostos para melhor performance
UserAcessoPremiumSchema.index({ userId: 1, tipoAcesso: 1 });
UserAcessoPremiumSchema.index({ userId: 1, estado: 1, cidade: 1 });
UserAcessoPremiumSchema.index({ userId: 1, ativo: 1 });
