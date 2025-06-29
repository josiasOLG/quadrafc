import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransacaoMoeda, TransacaoMoedaDocument } from '../../shared/schemas/transacao-moeda.schema';

@Injectable()
export class TransacoesMoedasService {
  constructor(
    @InjectModel(TransacaoMoeda.name) private transacaoModel: Model<TransacaoMoedaDocument>,
  ) {}

  async create(transacaoData: Partial<TransacaoMoeda>): Promise<TransacaoMoeda> {
    const createdTransacao = new this.transacaoModel(transacaoData);
    return createdTransacao.save();
  }

  async findByUser(userId: string): Promise<TransacaoMoeda[]> {
    return this.transacaoModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async registrarGanho(
    userId: string,
    origem: string,
    quantidade: number,
    descricao: string
  ): Promise<TransacaoMoeda> {
    return this.create({
      userId: new Types.ObjectId(userId),
      tipo: 'ganho',
      origem,
      quantidade,
      descricao
    });
  }

  async registrarGasto(
    userId: string,
    origem: string,
    quantidade: number,
    descricao: string
  ): Promise<TransacaoMoeda> {
    return this.create({
      userId: new Types.ObjectId(userId),
      tipo: 'gasto',
      origem,
      quantidade,
      descricao
    });
  }

  async obterExtratoMensal(userId: string, ano: number, mes: number): Promise<TransacaoMoeda[]> {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59);

    return this.transacaoModel.find({
      userId,
      createdAt: {
        $gte: dataInicio,
        $lte: dataFim
      }
    }).sort({ createdAt: -1 }).exec();
  }
}
