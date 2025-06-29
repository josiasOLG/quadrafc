import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type RodadaDocument = Rodada & Document;

@Schema({ timestamps: true })
export class Rodada {
  @ApiProperty({ description: 'Nome da rodada' })
  @Prop({ required: true })
  nome: string;

  @ApiProperty({ description: 'Descrição da rodada' })
  @Prop()
  descricao: string;

  @ApiProperty({ description: 'Data de início da rodada' })
  @Prop({ required: true })
  dataInicio: Date;

  @ApiProperty({ description: 'Data de fim da rodada' })
  @Prop({ required: true })
  dataFim: Date;

  @ApiProperty({ description: 'Se a rodada está ativa' })
  @Prop({ default: false })
  ativa: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export const RodadaSchema = SchemaFactory.createForClass(Rodada);
