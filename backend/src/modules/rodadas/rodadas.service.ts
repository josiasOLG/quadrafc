import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rodada, RodadaDocument } from '../../shared/schemas/rodada.schema';

@Injectable()
export class RodadasService {
  constructor(
    @InjectModel(Rodada.name) private rodadaModel: Model<RodadaDocument>,
  ) {}

  async findAll(): Promise<RodadaDocument[]> {
    return this.rodadaModel.find().sort({ dataInicio: -1 }).exec();
  }

  async findAtiva(): Promise<RodadaDocument> {
    return this.rodadaModel.findOne({ ativa: true }).exec();
  }

  async create(createRodadaDto: Partial<Rodada>): Promise<RodadaDocument> {
    const createdRodada = new this.rodadaModel(createRodadaDto);
    return createdRodada.save();
  }

  async ativar(id: string): Promise<RodadaDocument> {
    // Desativar todas as rodadas
    await this.rodadaModel.updateMany({}, { ativa: false });
    
    // Ativar a rodada específica
    return this.rodadaModel.findByIdAndUpdate(
      id,
      { ativa: true },
      { new: true }
    ).exec();
  }

  async desativar(id: string): Promise<RodadaDocument> {
    return this.rodadaModel.findByIdAndUpdate(
      id,
      { ativa: false },
      { new: true }
    ).exec();
  }
}
