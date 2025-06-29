import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TransacaoMoedaDocument = TransacaoMoeda & Document;

@Schema({ timestamps: true })
export class TransacaoMoeda {
  @ApiProperty({ description: 'ID do usuário' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Tipo da transação', enum: ['ganho', 'gasto'] })
  @Prop({ enum: ['ganho', 'gasto'], required: true })
  tipo: string;

  @ApiProperty({ description: 'Origem da transação' })
  @Prop({ required: true })
  origem: string;

  @ApiProperty({ description: 'Quantidade de moedas' })
  @Prop({ required: true })
  quantidade: number;

  @ApiProperty({ description: 'Descrição da transação' })
  @Prop({ required: true })
  descricao: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;
}

export const TransacaoMoedaSchema = SchemaFactory.createForClass(TransacaoMoeda);
