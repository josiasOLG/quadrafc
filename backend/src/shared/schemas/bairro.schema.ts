import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type BairroDocument = Bairro & Document;

@Schema({ timestamps: true })
export class Bairro {
  @ApiProperty({ description: 'Nome do bairro' })
  @Prop({ required: true })
  nome: string;

  @ApiProperty({ description: 'Cidade do bairro' })
  @Prop({ required: true })
  cidade: string;

  @ApiProperty({ description: 'Estado do bairro' })
  @Prop({ required: true })
  estado: string;

  @ApiProperty({ description: 'País do bairro' })
  @Prop({ required: true, default: 'Brasil' })
  pais: string;

  @ApiProperty({ description: 'CEP do bairro', required: false })
  @Prop({ required: false })
  cep?: string;

  @ApiProperty({ description: 'Total de pontos do bairro' })
  @Prop({ default: 0 })
  totalPoints: number;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export const BairroSchema = SchemaFactory.createForClass(Bairro);
