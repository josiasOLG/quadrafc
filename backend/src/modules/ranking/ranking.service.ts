import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bairro, BairroDocument } from '../../shared/schemas/bairro.schema';
import { Jogo, JogoDocument } from '../../shared/schemas/jogo.schema';
import { User, UserDocument } from '../../shared/schemas/user.schema';
import { PremiumAccessService } from '../../shared/services/premium-access.service';

export interface FiltroRanking {
  label: string;
  value: string;
  disponivel: boolean;
  gratuito: boolean;
  custo?: number;
}

export interface RankingUsuario {
  _id: string;
  nome: string;
  avatar?: string;
  avatarUrl?: string;
  bairro: string;
  cidade: string;
  estado: string;
  totalPoints: number;
  pontos: number;
  palpites_corretos: number;
  total_palpites: number;
  taxa_acerto: number;
  sequencia_atual: number;
  posicao: number;
  isCurrentUser?: boolean;
}

export interface RankingBairro {
  _id: string;
  nome: string;
  cidade: string;
  estado: string;
  pontos_totais: number;
  usuarios_ativos: number;
  media_pontuacao: number;
  total_usuarios: number;
  posicao: number;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface CampeonatoResumo {
  id: string;
  nome: string;
  logo?: string;
  dataInicio: Date;
  dataFim: Date;
  quantidadeDeJogos: number;
  status: string;
}

@Injectable()
export class RankingService {
  constructor(
    @InjectModel(User.name) public userModel: Model<UserDocument>,
    @InjectModel(Bairro.name) private bairroModel: Model<BairroDocument>,
    @InjectModel(Jogo.name) private jogoModel: Model<JogoDocument>,
    private premiumAccessService: PremiumAccessService
  ) {}

  async verificarAcessoPremium(userId: string) {
    const acessos = await this.premiumAccessService.listarAcessosUsuario(userId);

    // Verificar se tem acesso premium (assinatura ou acesso nacional)
    const temAcesso = acessos.assinaturaPremium || acessos.temAcessoNacional;

    return {
      temAcesso,
      custoDesbloqueio: acessos.custos.nacional,
      assinaturaPremium: acessos.assinaturaPremium,
      dataVencimentoPremium: acessos.dataVencimentoPremium,
      estadosAcessiveis: acessos.estadosAcessiveis,
      cidadesAcessiveis: acessos.cidadesAcessiveis,
      temAcessoNacional: acessos.temAcessoNacional,
    };
  }

  async listarAcessosDisponiveis(userId: string) {
    return this.premiumAccessService.listarAcessosUsuario(userId);
  }

  async verificarAcessoEspecifico(
    userId: string,
    tipoAcesso: 'cidade' | 'estado' | 'nacional',
    estado?: string,
    cidade?: string
  ) {
    switch (tipoAcesso) {
      case 'cidade':
        if (!cidade || !estado) {
          throw new Error('Cidade e estado são obrigatórios para verificar acesso à cidade');
        }
        const temAcessoCidade = await this.premiumAccessService.temAcessoCidade(
          userId,
          cidade,
          estado
        );
        return {
          temAcesso: temAcessoCidade,
          custoDesbloqueio: this.premiumAccessService.getCustos().cidade,
        };
      case 'estado':
        if (!estado) {
          throw new Error('Estado é obrigatório para verificar acesso ao estado');
        }
        const temAcessoEstado = await this.premiumAccessService.temAcessoEstado(userId, estado);
        return {
          temAcesso: temAcessoEstado,
          custoDesbloqueio: this.premiumAccessService.getCustos().estado,
        };
      case 'nacional':
        const temAcessoNacional = await this.premiumAccessService.temAcessoNacional(userId);
        return {
          temAcesso: temAcessoNacional,
          custoDesbloqueio: this.premiumAccessService.getCustos().nacional,
        };
      default:
        throw new Error('Tipo de acesso inválido');
    }
  }

  async comprarAcessoCidade(userId: string, cidade: string, estado: string) {
    return this.premiumAccessService.comprarAcessoCidade(userId, cidade, estado);
  }

  async comprarAcessoEstado(userId: string, estado: string) {
    return this.premiumAccessService.comprarAcessoEstado(userId, estado);
  }

  async comprarAcessoNacional(userId: string) {
    return this.premiumAccessService.comprarAcessoNacional(userId);
  }

  async comprarAssinaturaPremium(userId: string, meses: number = 1) {
    return this.premiumAccessService.comprarAssinaturaPremium(userId, meses);
  }

  // Manter compatibilidade com método antigo
  async desbloquearRankingNacional(userId: string) {
    return this.premiumAccessService.comprarAcessoNacional(userId);
  }

  async listarFiltrosDisponiveis(userId: string) {
    const acessos = await this.premiumAccessService.listarAcessosUsuario(userId);

    const filtros: FiltroRanking[] = [
      { label: 'Meu Bairro', value: 'bairro', disponivel: true, gratuito: true },
      { label: 'Minha Cidade', value: 'cidade', disponivel: true, gratuito: true },
    ];

    // Estados disponíveis
    if (acessos.assinaturaPremium) {
      // Se tem assinatura premium, libera tudo
      filtros.push(
        { label: 'Meu Estado', value: 'estado', disponivel: true, gratuito: false },
        { label: 'Nacional', value: 'nacional', disponivel: true, gratuito: false }
      );
    } else {
      // Verificar acessos específicos
      if (acessos.estadosAcessiveis.length > 0 || acessos.temAcessoNacional) {
        filtros.push({ label: 'Meu Estado', value: 'estado', disponivel: true, gratuito: false });
      } else {
        filtros.push({
          label: 'Meu Estado',
          value: 'estado',
          disponivel: false,
          gratuito: false,
          custo: acessos.custos.estado,
        });
      }

      if (acessos.temAcessoNacional) {
        filtros.push({ label: 'Nacional', value: 'nacional', disponivel: true, gratuito: false });
      } else {
        filtros.push({
          label: 'Nacional',
          value: 'nacional',
          disponivel: false,
          gratuito: false,
          custo: acessos.custos.nacional,
        });
      }
    }

    return {
      filtros,
      acessos: {
        assinaturaPremium: acessos.assinaturaPremium,
        dataVencimentoPremium: acessos.dataVencimentoPremium,
        estadosAcessiveis: acessos.estadosAcessiveis,
        cidadesAcessiveis: acessos.cidadesAcessiveis,
        temAcessoNacional: acessos.temAcessoNacional,
      },
      custos: acessos.custos,
    };
  }

  async getRankingUsuariosCidade(
    cidade: string,
    estado: string,
    params: PaginationParams,
    campeonato?: string
  ) {
    // Verificar se cidade e estado são válidos
    if (!cidade || !estado) {
      throw new Error('Cidade e estado são obrigatórios');
    }

    let usuarios: any[] = [];
    let totalUsuarios = 0;

    if (campeonato) {
      // Se campeonato for especificado, usar agregação com join
      const aggregationPipeline: any[] = [
        // Filtrar usuários por cidade/estado
        {
          $match: {
            cidade: cidade,
            estado: estado,
          },
        },
        // Lookup com palpites
        {
          $lookup: {
            from: 'palpites',
            localField: '_id',
            foreignField: 'userId',
            as: 'palpites',
          },
        },
        // Unwind palpites (preservando usuários sem palpites)
        {
          $unwind: {
            path: '$palpites',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup com jogos para filtrar por campeonato
        {
          $lookup: {
            from: 'jogos',
            localField: 'palpites.jogoId',
            foreignField: '_id',
            as: 'jogo',
          },
        },
        // Unwind jogo
        {
          $unwind: {
            path: '$jogo',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Agrupar de volta por usuário
        {
          $group: {
            _id: '$_id',
            nome: { $first: '$nome' },
            avatarUrl: { $first: '$avatarUrl' },
            bairro: { $first: '$bairro' },
            cidade: { $first: '$cidade' },
            estado: { $first: '$estado' },
            totalPoints: { $first: '$totalPoints' }, // Usar totalPoints da tabela users
            totalPalpitesCampeonato: {
              $sum: {
                $cond: [
                  {
                    $and: [{ $ne: ['$palpites', null] }, { $eq: ['$jogo.campeonato', campeonato] }],
                  },
                  1,
                  0,
                ],
              },
            },
            palpitesCorretos: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$palpites', null] },
                      { $eq: ['$jogo.campeonato', campeonato] },
                      { $gt: ['$palpites.pontos', 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        // Filtrar apenas usuários que fizeram pelo menos um palpite neste campeonato
        {
          $match: {
            totalPalpitesCampeonato: { $gt: 0 },
          },
        },
        // Ordenar por pontos totais do usuário (totalPoints da tabela users)
        {
          $sort: { totalPoints: -1 },
        },
        // Paginação
        {
          $skip: params.offset,
        },
        {
          $limit: params.limit,
        },
      ];

      usuarios = await this.userModel.aggregate(aggregationPipeline).exec();

      // Contar total para paginação
      const countPipeline: any[] = [
        {
          $match: {
            cidade: cidade,
            estado: estado,
          },
        },
        {
          $lookup: {
            from: 'palpites',
            localField: '_id',
            foreignField: 'userId',
            as: 'palpites',
          },
        },
        {
          $unwind: {
            path: '$palpites',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'jogos',
            localField: 'palpites.jogoId',
            foreignField: '_id',
            as: 'jogo',
          },
        },
        {
          $unwind: {
            path: '$jogo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$_id',
            totalPalpitesCampeonato: {
              $sum: {
                $cond: [
                  {
                    $and: [{ $ne: ['$palpites', null] }, { $eq: ['$jogo.campeonato', campeonato] }],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $match: {
            totalPalpitesCampeonato: { $gt: 0 },
          },
        },
        {
          $count: 'total',
        },
      ];

      const countResult = await this.userModel.aggregate(countPipeline).exec();
      totalUsuarios = countResult.length > 0 ? countResult[0].total : 0;
    } else {
      // Se não especificar campeonato, usar query simples
      const userFilter = {
        cidade: cidade,
        estado: estado,
      };

      usuarios = await this.userModel
        .find(userFilter)
        .sort({ totalPoints: -1 })
        .skip(params.offset)
        .limit(params.limit)
        .exec();

      totalUsuarios = await this.userModel.countDocuments(userFilter);
    }

    // Formatar dados para o ranking
    const rankingData: RankingUsuario[] = usuarios.map((user, index) => {
      const pontos = campeonato ? user.totalPoints || 0 : user.totalPoints || 0;
      const totalPalpites = campeonato ? user.totalPalpitesCampeonato || 0 : 0;
      const palpitesCorretos = campeonato ? user.palpitesCorretos || 0 : 0;
      const taxaAcerto = totalPalpites > 0 ? (palpitesCorretos / totalPalpites) * 100 : 0;

      return {
        _id: user._id.toString(),
        nome: user.nome,
        avatar: user.avatarUrl || '',
        avatarUrl: user.avatarUrl || '',
        bairro: user.bairro || '',
        cidade: user.cidade || '',
        estado: user.estado || '',
        totalPoints: pontos,
        pontos: pontos,
        palpites_corretos: palpitesCorretos,
        total_palpites: totalPalpites,
        taxa_acerto: taxaAcerto,
        sequencia_atual: 0, // TODO: Implementar lógica de sequência
        posicao: params.offset + index + 1,
        isCurrentUser: false,
      };
    });

    return {
      data: rankingData,
      pagination: {
        total: totalUsuarios,
        limit: params.limit,
        offset: params.offset,
        hasNext: params.offset + params.limit < totalUsuarios,
        hasPrev: params.offset > 0,
      },
      cidade: cidade,
      estado: estado,
    };
  }

  async getRankingBairrosCidade(
    cidade: string,
    estado: string,
    params: PaginationParams,
    campeonato?: string
  ) {
    if (!cidade || !estado) {
      throw new Error('Cidade e estado são obrigatórios');
    }

    // Pipeline com joins: users → palpites → jogos
    const bairrosPipeline: any[] = [
      // 1. Filtrar usuários da cidade/estado com bairro
      {
        $match: {
          cidade: cidade,
          estado: estado,
          bairro: { $exists: true, $ne: null, $nin: [''] },
        },
      },
      // 2. Join com palpites do usuário
      {
        $lookup: {
          from: 'palpites',
          localField: '_id',
          foreignField: 'userId',
          as: 'palpites',
        },
      },
      // 3. Unwind palpites (preservando usuários sem palpites)
      {
        $unwind: {
          path: '$palpites',
          preserveNullAndEmptyArrays: true,
        },
      },
      // 4. Join palpite → jogo para pegar dados do jogo
      {
        $lookup: {
          from: 'jogos',
          localField: 'palpites.jogoId',
          foreignField: '_id',
          as: 'jogo',
        },
      },
      // 5. Unwind jogo
      {
        $unwind: {
          path: '$jogo',
          preserveNullAndEmptyArrays: true,
        },
      },
      // 6. Filtrar apenas jogos do campeonato específico OU usuários sem palpites neste campeonato
      {
        $match: {
          $or: [
            { 'jogo.campeonato': campeonato },
            { jogo: { $exists: false } }, // Usuários sem palpites neste campeonato
          ],
        },
      },
      // 7. Agrupar por bairro e somar pontos do campeonato
      {
        $group: {
          _id: '$bairro',
          nome: { $first: '$bairro' },
          cidade: { $first: '$cidade' },
          estado: { $first: '$estado' },
          pontos_totais: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$palpites', null] }, { $eq: ['$jogo.campeonato', campeonato] }] },
                '$palpites.pontos',
                0,
              ],
            },
          },
          usuarios_ativos: {
            $addToSet: {
              $cond: [
                { $and: [{ $ne: ['$palpites', null] }, { $eq: ['$jogo.campeonato', campeonato] }] },
                '$_id',
                null,
              ],
            },
          },
          total_palpites: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$palpites', null] }, { $eq: ['$jogo.campeonato', campeonato] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      // 8. Limpar array de usuários ativos (remover nulls)
      {
        $addFields: {
          usuarios_ativos: {
            $filter: {
              input: '$usuarios_ativos',
              cond: { $ne: ['$$this', null] },
            },
          },
        },
      },
      // 9. Calcular estatísticas
      {
        $addFields: {
          usuarios_ativos_count: { $size: '$usuarios_ativos' },
          media_pontuacao: {
            $cond: [
              { $gt: [{ $size: '$usuarios_ativos' }, 0] },
              { $divide: ['$pontos_totais', { $size: '$usuarios_ativos' }] },
              0,
            ],
          },
        },
      },
      // 10. Renomear campo
      {
        $addFields: {
          usuarios_ativos: '$usuarios_ativos_count',
        },
      },
      // 11. Filtrar apenas bairros que têm usuários que fizeram palpites neste campeonato
      {
        $match: {
          usuarios_ativos: { $gt: 0 },
        },
      },
      // 12. Ordenar por pontos totais
      {
        $sort: { pontos_totais: -1 },
      },
      // 13. Paginação
      {
        $skip: params.offset,
      },
      {
        $limit: params.limit,
      },
    ];

    const bairrosData = await this.userModel.aggregate(bairrosPipeline).exec();

    if (bairrosData.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          limit: params.limit,
          offset: params.offset,
          hasNext: false,
          hasPrev: false,
        },
        cidade: cidade,
        estado: estado,
      };
    }

    // Mapear dados para o formato esperado
    const rankingBairros: RankingBairro[] = bairrosData.map((bairro, index) => ({
      _id: bairro._id,
      nome: bairro.nome || bairro._id,
      cidade: bairro.cidade,
      estado: bairro.estado,
      pontos_totais: bairro.pontos_totais || 0,
      usuarios_ativos: bairro.usuarios_ativos || 0,
      total_usuarios: bairro.usuarios_ativos || 0,
      media_pontuacao: Math.round((bairro.media_pontuacao || 0) * 100) / 100,
      posicao: params.offset + index + 1,
    }));

    // Contar total para paginação (simplificado)
    const totalBairros = rankingBairros.length;

    return {
      data: rankingBairros,
      pagination: {
        total: totalBairros,
        limit: params.limit,
        offset: params.offset,
        hasNext: params.offset + params.limit < totalBairros,
        hasPrev: params.offset > 0,
      },
      cidade: cidade,
      estado: estado,
    };
  }

  async getRankingTopUsuariosPorBairro(cidade: string, estado: string, campeonato?: string) {
    if (!cidade || !estado) {
      throw new Error('Cidade e estado são obrigatórios');
    }

    // Pipeline com joins: users → palpites → jogos
    const aggregationPipeline: any[] = [
      // 1. Filtrar usuários por cidade/estado, que tenham bairro
      {
        $match: {
          cidade: cidade,
          estado: estado,
          bairro: { $exists: true, $ne: null, $nin: [''] },
        },
      },
      // 2. Join com palpites do usuário
      {
        $lookup: {
          from: 'palpites',
          localField: '_id',
          foreignField: 'userId',
          as: 'palpites',
        },
      },
      // 3. Unwind palpites (não preservar usuários sem palpites)
      {
        $unwind: {
          path: '$palpites',
          preserveNullAndEmptyArrays: false,
        },
      },
      // 4. Join palpite → jogo para pegar dados do jogo
      {
        $lookup: {
          from: 'jogos',
          localField: 'palpites.jogoId',
          foreignField: '_id',
          as: 'jogo',
        },
      },
      // 5. Unwind jogo
      {
        $unwind: {
          path: '$jogo',
          preserveNullAndEmptyArrays: false,
        },
      },
      // 6. Filtrar apenas jogos do campeonato específico
      {
        $match: {
          'jogo.campeonato': campeonato,
        },
      },
      // 7. Agrupar por usuário e contar palpites do campeonato
      {
        $group: {
          _id: '$_id',
          nome: { $first: '$nome' },
          avatarUrl: { $first: '$avatarUrl' },
          bairro: { $first: '$bairro' },
          cidade: { $first: '$cidade' },
          estado: { $first: '$estado' },
          totalPoints: { $first: '$totalPoints' },
          totalPalpitesCampeonato: { $sum: 1 },
        },
      },
      // 8. Filtrar apenas usuários que fizeram pelo menos um palpite neste campeonato
      {
        $match: {
          totalPalpitesCampeonato: { $gt: 0 },
        },
      },
      // 9. Ordenar por pontos totais do usuário
      {
        $sort: { totalPoints: -1 },
      },
    ];

    const todosUsuarios = await this.userModel.aggregate(aggregationPipeline).exec();

    if (todosUsuarios.length === 0) {
      return {
        podio: [],
        outros: [],
        cidade: cidade,
        estado: estado,
      };
    }

    // Formatar todos os usuários para o ranking
    const usuariosFormatados: RankingUsuario[] = todosUsuarios.map((user, index) => {
      const pontos = user.totalPoints || 0;
      const totalPalpites = user.totalPalpitesCampeonato || 0;
      const taxaAcerto = totalPalpites > 0 ? 100 : 0;

      return {
        _id: user._id.toString(),
        nome: user.nome,
        avatar: user.avatarUrl || '',
        avatarUrl: user.avatarUrl || '',
        bairro: user.bairro || '',
        cidade: user.cidade || '',
        estado: user.estado || '',
        totalPoints: pontos,
        pontos: pontos,
        palpites_corretos: totalPalpites, // Agora conta todos os palpites como "corretos"
        total_palpites: totalPalpites,
        taxa_acerto: taxaAcerto,
        sequencia_atual: 0,
        posicao: index + 1,
        isCurrentUser: false,
      };
    });

    // Separar pódio (3 primeiros) dos outros usuários
    const podio = usuariosFormatados.slice(0, 3);
    const outros = usuariosFormatados.slice(3);

    return {
      podio: podio,
      outros: outros,
      cidade: cidade,
      estado: estado,
    };
  }
  async getCampeonatosMesAtual(): Promise<CampeonatoResumo[]> {
    const agora = new Date();
    const inicioMes = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), 1));
    const fimMes = new Date(
      Date.UTC(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999)
    );

    const jogosPorString = await this.jogoModel
      .find({
        data: {
          $gte: inicioMes.toISOString(),
        },
      })
      .exec();
    const jogosPorDate = await this.jogoModel
      .find({
        data: {
          $gte: inicioMes,
        },
      })
      .exec();

    const jogosPorRegex = await this.jogoModel
      .find({
        data: {
          $regex: /^2025-07/,
        },
      })
      .exec();

    let filtroData = {};
    if (jogosPorDate.length > 0) {
      filtroData = {
        data: {
          $gte: inicioMes,
        },
      };
    } else if (jogosPorString.length > 0) {
      filtroData = {
        data: {
          $gte: inicioMes.toISOString(),
        },
      };
    } else if (jogosPorRegex.length > 0) {
      filtroData = {
        data: {
          $regex: new RegExp(
            `^${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
          ),
        },
      };
    }

    // Fazer o aggregate usando o filtro que funcionou
    const campeonatos = await this.jogoModel.aggregate([
      {
        $match: filtroData,
      },
      {
        $group: {
          _id: '$campeonato',
          nome: { $first: '$campeonato' },
          quantidadeDeJogos: { $sum: 1 },
          dataInicio: { $min: '$data' },
          dataFim: { $max: '$data' },
        },
      },
      {
        $sort: { quantidadeDeJogos: -1 },
      },
    ]);

    return campeonatos.map((camp, index) => ({
      id: `${index + 1}`,
      nome: camp.nome || 'Outros',
      logo: `https://via.placeholder.com/60x60/007bff/ffffff?text=${encodeURIComponent((camp.nome || 'O').charAt(0))}`,
      dataInicio: camp.dataInicio,
      dataFim: camp.dataFim,
      quantidadeDeJogos: camp.quantidadeDeJogos,
      status: this.determinarStatusCampeonato(camp.dataInicio, camp.dataFim),
    }));
  }

  private determinarStatusCampeonato(dataInicio: Date, dataFim: Date): string {
    const agora = new Date();

    if (agora < dataInicio) {
      return 'agendado';
    } else if (agora > dataFim) {
      return 'finalizado';
    } else {
      return 'em_andamento';
    }
  }
}
