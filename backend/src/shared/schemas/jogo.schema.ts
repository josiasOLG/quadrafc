import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type JogoDocument = Jogo & Document;

class TimeInfo {
  @ApiProperty({ description: 'Nome do time' })
  @Prop({ required: true })
  nome: string;

  @ApiProperty({ description: 'URL do escudo do time' })
  @Prop({ required: true })
  escudo: string;
}

class Resultado {
  @ApiProperty({ description: 'Gols do time A' })
  @Prop({ type: Number, default: null })
  timeA: number;

  @ApiProperty({ description: 'Gols do time B' })
  @Prop({ type: Number, default: null })
  timeB: number;
}

@Schema({ timestamps: true })
export class Jogo {
  @ApiProperty({ description: 'Código da API externa' })
  @Prop({ required: true, unique: true })
  codigoAPI: number;

  @ApiProperty({ description: 'Informações do time A' })
  @Prop({ type: TimeInfo, required: true })
  timeA: TimeInfo;

  @ApiProperty({ description: 'Informações do time B' })
  @Prop({ type: TimeInfo, required: true })
  timeB: TimeInfo;

  @ApiProperty({ description: 'Data e hora do jogo' })
  @Prop({ required: true })
  data: string;

  @ApiProperty({ description: 'Resultado do jogo' })
  @Prop({ type: Resultado })
  resultado: Resultado;

  @ApiProperty({
    description: 'Status do jogo',
    enum: [
      'aberto',
      'encerrado',
      'agendado',
      'confirmado',
      'em_andamento',
      'pausado',
      'prorrogacao',
      'penaltis',
      'suspenso',
      'adiado',
      'cancelado',
      'declarado',
    ],
  })
  @Prop({
    enum: [
      'aberto',
      'encerrado',
      'agendado',
      'confirmado',
      'em_andamento',
      'pausado',
      'prorrogacao',
      'penaltis',
      'suspenso',
      'adiado',
      'cancelado',
      'declarado',
    ],
    default: 'aberto',
  })
  status: string;

  @ApiProperty({ description: 'Palpites associados ao jogo', type: [String] })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Palpite' }], default: [] })
  palpites?: Types.ObjectId[];

  @ApiProperty({ description: 'Nome do campeonato' })
  @Prop({ required: true })
  campeonato: string;

  @ApiProperty({ description: 'Data de início do campeonato' })
  @Prop({ required: false })
  campeonatoStartDate?: string;

  @ApiProperty({ description: 'Data de fim do campeonato' })
  @Prop({ required: false })
  campeonatoEndDate?: string;

  @ApiProperty({ description: 'ID da rodada' })
  @Prop({ type: Types.ObjectId, ref: 'Rodada', required: false })
  rodadaId?: Types.ObjectId;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export const JogoSchema = SchemaFactory.createForClass(Jogo);
