import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CidadeDocument = Cidade & Document;

@Schema({ timestamps: true })
export class Cidade {
  @Prop({ required: true })
  nome: string;

  @Prop({ required: true })
  estado: string;

  @Prop({ required: true })
  uf: string;

  @Prop()
  regiao: string;

  @Prop()
  codigo_ibge: string;

  @Prop({ default: true })
  ativo: boolean;

  @Prop({ default: 0 })
  total_bairros: number;
}

export const CidadeSchema = SchemaFactory.createForClass(Cidade);
