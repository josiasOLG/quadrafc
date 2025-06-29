import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conquista, ConquistaDocument } from '../../shared/schemas/conquista.schema';
import { ConquistaUsuario, ConquistaUsuarioDocument } from '../../shared/schemas/conquista-usuario.schema';
import { PaginationDto } from '../../shared/dto/pagination.dto';

@Injectable()
export class ConquistasService {
  constructor(
    @InjectModel(Conquista.name) private conquistaModel: Model<ConquistaDocument>,
    @InjectModel(ConquistaUsuario.name) private conquistaUsuarioModel: Model<ConquistaUsuarioDocument>,
  ) {}

  async findAll(): Promise<Conquista[]> {
    return this.conquistaModel.find({ ativo: true }).exec();
  }

  async getMinhasConquistas(
    userId: string,
    paginationDto: PaginationDto
  ): Promise<{ data: ConquistaUsuario[]; total: number }> {
    const filter = { 
      usuario: new Types.ObjectId(userId),
      completada: true 
    };

    const [data, total] = await Promise.all([
      this.conquistaUsuarioModel
        .find(filter)
        .populate('conquista')
        .sort({ data_conquistada: -1 })
        .skip(paginationDto.skip)
        .limit(paginationDto.limit)
        .exec(),
      this.conquistaUsuarioModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async getConquistasDisponiveis(
    userId: string,
    paginationDto: PaginationDto
  ): Promise<{ data: Conquista[]; total: number }> {
    // Encontrar conquistas que o usuário ainda não tem
    const conquistasUsuario = await this.conquistaUsuarioModel
      .find({ usuario: new Types.ObjectId(userId) })
      .select('conquista')
      .exec();

    const conquistasIds = conquistasUsuario.map(cu => cu.conquista);

    const filter = {
      ativo: true,
      _id: { $nin: conquistasIds }
    };

    const [data, total] = await Promise.all([
      this.conquistaModel
        .find(filter)
        .skip(paginationDto.skip)
        .limit(paginationDto.limit)
        .exec(),
      this.conquistaModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async getProgressoConquistas(
    userId: string,
    paginationDto: PaginationDto
  ): Promise<{ data: ConquistaUsuario[]; total: number }> {
    const filter = { 
      usuario: new Types.ObjectId(userId),
      completada: false 
    };

    const [data, total] = await Promise.all([
      this.conquistaUsuarioModel
        .find(filter)
        .populate('conquista')
        .sort({ progresso_atual: -1 })
        .skip(paginationDto.skip)
        .limit(paginationDto.limit)
        .exec(),
      this.conquistaUsuarioModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async getEstatisticasConquistas(userId: string) {
    const conquistasUsuario = await this.conquistaUsuarioModel
      .find({ usuario: new Types.ObjectId(userId) })
      .populate('conquista')
      .exec();

    const totalConquistas = await this.conquistaModel.countDocuments({ ativo: true }).exec();
    const conquistasCompletadas = conquistasUsuario.filter(cu => cu.completada).length;

    const pontosTotais = conquistasUsuario
      .filter(cu => cu.completada)
      .reduce((acc, cu) => acc + (cu.conquista as any).pontos_recompensa, 0);

    const moedasTotais = conquistasUsuario
      .filter(cu => cu.completada)
      .reduce((acc, cu) => acc + (cu.conquista as any).moedas_recompensa, 0);

    // Estatísticas por categoria
    const porCategoria = conquistasUsuario
      .filter(cu => cu.completada)
      .reduce((acc, cu) => {
        const categoria = (cu.conquista as any).categoria;
        acc[categoria] = (acc[categoria] || 0) + 1;
        return acc;
      }, {});

    // Estatísticas por tipo
    const porTipo = conquistasUsuario
      .filter(cu => cu.completada)
      .reduce((acc, cu) => {
        const tipo = (cu.conquista as any).tipo;
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {});

    return {
      total_conquistas: totalConquistas,
      conquistas_completadas: conquistasCompletadas,
      pontos_totais: pontosTotais,
      moedas_totais: moedasTotais,
      por_categoria: porCategoria,
      por_tipo: porTipo
    };
  }

  async reivindicarConquista(userId: string, conquistaId: string) {
    const conquistaUsuario = await this.conquistaUsuarioModel
      .findOne({
        usuario: new Types.ObjectId(userId),
        conquista: new Types.ObjectId(conquistaId),
        completada: true,
        data_conquistada: null
      })
      .populate('conquista')
      .exec();

    if (!conquistaUsuario) {
      throw new Error('Conquista não encontrada ou já reivindicada');
    }

    // Marcar como reivindicada
    conquistaUsuario.data_conquistada = new Date();
    await conquistaUsuario.save();

    const recompensas = {
      pontos: (conquistaUsuario.conquista as any).pontos_recompensa,
      moedas: (conquistaUsuario.conquista as any).moedas_recompensa
    };

    return {
      message: 'Conquista reivindicada com sucesso',
      recompensas
    };
  }
}
