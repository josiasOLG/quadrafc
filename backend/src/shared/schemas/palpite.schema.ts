import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PalpiteDocument = Palpite & Document;

class PalpiteInfo {
  @ApiProperty({ description: 'Palpite para o time A' })
  @Prop({ required: true })
  timeA: number;

  @ApiProperty({ description: 'Palpite para o time B' })
  @Prop({ required: true })
  timeB: number;
}

@Schema({ timestamps: true })
export class Palpite {
  @ApiProperty({ description: 'ID do usuário' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'ID do jogo' })
  @Prop({ type: Types.ObjectId, ref: 'Jogo', required: true })
  jogoId: Types.ObjectId;

  @ApiProperty({ description: 'Palpite do usuário' })
  @Prop({ type: PalpiteInfo, required: true })
  palpite: PalpiteInfo;

  @ApiProperty({ description: 'Se acertou o placar exato' })
  @Prop({ default: false })
  acertouPlacar: boolean;

  @ApiProperty({ description: 'Se acertou o resultado (vitória/empate/derrota)' })
  @Prop({ default: false })
  acertouResultado: boolean;

  @ApiProperty({ description: 'Pontos ganhos com este palpite' })
  @Prop({ default: 0 })
  pontos: number;

  @ApiProperty({ description: 'Moedas ganhas com este palpite' })
  @Prop({ default: 0 })
  moedasGanhas: number;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export const PalpiteSchema = SchemaFactory.createForClass(Palpite);

// Índice composto para evitar palpites duplicados por usuário e jogo
PalpiteSchema.index({ userId: 1, jogoId: 1 }, { unique: true });
