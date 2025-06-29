import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConquistaUsuarioDocument = ConquistaUsuario & Document;

@Schema({ timestamps: true })
export class ConquistaUsuario {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  usuario: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conquista', required: true })
  conquista: Types.ObjectId;

  @Prop({ default: null })
  data_conquistada: Date;

  @Prop({ default: 0 })
  progresso_atual: number;

  @Prop({ required: true })
  progresso_necessario: number;

  @Prop({ default: false })
  completada: boolean;
}

export const ConquistaUsuarioSchema = SchemaFactory.createForClass(ConquistaUsuario);
