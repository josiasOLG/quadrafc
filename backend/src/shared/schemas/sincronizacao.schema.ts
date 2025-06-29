import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SincronizacaoDocument = Sincronizacao & Document;

@Schema({ timestamps: true })
export class Sincronizacao {
  @ApiProperty({ description: 'Data no formato YYYY-MM-DD' })
  @Prop({ required: true, unique: true })
  data: string;

  @ApiProperty({ description: 'Última sincronização com a API externa' })
  @Prop({ required: true })
  ultimaSincronizacao: Date;

  @ApiProperty({ description: 'Quantidade de jogos encontrados na última sincronização' })
  @Prop({ default: 0 })
  totalJogos: number;

  @ApiProperty({ description: 'Status da última sincronização' })
  @Prop({ enum: ['sucesso', 'erro', 'sem_dados'], default: 'sucesso' })
  status: string;

  @ApiProperty({ description: 'Detalhes do erro, se houver' })
  @Prop({ required: false })
  erroDetalhes?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export const SincronizacaoSchema = SchemaFactory.createForClass(Sincronizacao);
