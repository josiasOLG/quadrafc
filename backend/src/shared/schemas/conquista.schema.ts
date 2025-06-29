import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConquistaDocument = Conquista & Document;

@Schema({ timestamps: true })
export class Conquista {
  @Prop({ required: true })
  nome: string;

  @Prop({ required: true })
  descricao: string;

  @Prop({ required: true, enum: ['palpites', 'sequencia', 'participacao', 'social', 'nivel'] })
  categoria: string;

  @Prop({ required: true, enum: ['bronze', 'prata', 'ouro', 'diamante'] })
  tipo: string;

  @Prop({ required: true })
  icone: string;

  @Prop({
    type: {
      tipo: { type: String, required: true },
      valor: { type: Number, required: true },
      operador: { type: String, enum: ['>=', '>', '=', '<', '<='], required: true }
    },
    required: true
  })
  criterio: {
    tipo: string;
    valor: number;
    operador: string;
  };

  @Prop({ default: 0 })
  pontos_recompensa: number;

  @Prop({ default: 0 })
  moedas_recompensa: number;

  @Prop({ default: true })
  ativo: boolean;
}

export const ConquistaSchema = SchemaFactory.createForClass(Conquista);
