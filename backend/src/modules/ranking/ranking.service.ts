import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bairro, BairroDocument } from '../../shared/schemas/bairro.schema';
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

@Injectable()
export class RankingService {
  constructor(
    @InjectModel(User.name) public userModel: Model<UserDocument>,
    @InjectModel(Bairro.name) private bairroModel: Model<BairroDocument>,
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

  async getRankingUsuariosCidade(cidade: string, estado: string, params: PaginationParams) {
    console.log('🔍 Iniciando getRankingUsuariosCidade:', { cidade, estado, params });

    // Verificar se cidade e estado são válidos
    if (!cidade || !estado) {
      throw new Error('Cidade e estado são obrigatórios');
    }

    console.log('🔍 Buscando usuários da cidade diretamente na tabela users:', {
      cidade,
      estado,
    });

    // Buscar usuários que moram na cidade/estado especificados diretamente na tabela users
    const usuarios = await this.userModel
      .find({
        cidade: cidade,
        estado: estado,
      })
      .sort({ totalPoints: -1 })
      .skip(params.offset)
      .limit(params.limit)
      .exec();

    console.log(`👥 Encontrados ${usuarios.length} usuários na cidade ${cidade}/${estado}`);

    // Contar total de usuários da cidade
    const totalUsuarios = await this.userModel.countDocuments({
      cidade: cidade,
      estado: estado,
    });

    console.log(`📊 Total de usuários na cidade: ${totalUsuarios}`);

    // Formatar dados para o ranking
    const rankingData: RankingUsuario[] = usuarios.map((user, index) => {
      return {
        _id: user._id.toString(),
        nome: user.nome,
        avatar: user.avatarUrl || '',
        avatarUrl: user.avatarUrl || '',
        bairro: user.bairro || '',
        cidade: user.cidade || '',
        estado: user.estado || '',
        totalPoints: user.totalPoints || 0,
        pontos: user.totalPoints || 0,
        palpites_corretos: 0, // TODO: Implementar lógica de palpites
        total_palpites: 0, // TODO: Implementar lógica de palpites
        taxa_acerto: 0, // TODO: Implementar lógica de palpites
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

  async getRankingBairrosCidade(cidade: string, estado: string, params: PaginationParams) {
    console.log('🔍 Iniciando getRankingBairrosCidade:', { cidade, estado, params });

    // Verificar se cidade e estado são válidos
    if (!cidade || !estado) {
      throw new Error('Cidade e estado são obrigatórios');
    }

    console.log('🔍 Buscando bairros da cidade através dos usuários:', {
      cidade,
      estado,
    });

    // Usar agregação para agrupar usuários por bairro e calcular estatísticas
    const aggregationPipeline = [
      // Filtrar usuários da cidade/estado especificados
      {
        $match: {
          cidade: cidade,
          estado: estado,
          bairro: { $exists: true, $ne: null, $nin: [''] }, // Apenas usuários com bairro definido
        },
      },
      // Agrupar por bairro
      {
        $group: {
          _id: '$bairro',
          nome: { $first: '$bairro' },
          cidade: { $first: '$cidade' },
          estado: { $first: '$estado' },
          pontos_totais: { $sum: '$totalPoints' },
          usuarios_ativos: { $sum: 1 },
          media_pontuacao: { $avg: '$totalPoints' },
        },
      },
      // Ordenar por pontos totais (decrescente)
      {
        $sort: { pontos_totais: -1 as const },
      },
    ];

    console.log('📊 Executando agregação para calcular ranking de bairros...');

    const bairrosAgregados = await this.userModel.aggregate(aggregationPipeline).exec();

    console.log(`📊 Encontrados ${bairrosAgregados.length} bairros na cidade ${cidade}/${estado}`);

    if (bairrosAgregados.length === 0) {
      console.log('⚠️ Nenhum bairro encontrado para esta cidade/estado');
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

    // Definir posições e formatar dados
    const rankingBairros: RankingBairro[] = bairrosAgregados.map((bairro, index) => {
      return {
        _id: bairro._id || bairro.nome, // Usar nome do bairro como ID se não houver _id
        nome: bairro.nome,
        cidade: bairro.cidade,
        estado: bairro.estado,
        pontos_totais: bairro.pontos_totais || 0,
        usuarios_ativos: bairro.usuarios_ativos || 0,
        media_pontuacao: Math.round((bairro.media_pontuacao || 0) * 100) / 100, // 2 casas decimais
        total_usuarios: bairro.usuarios_ativos || 0,
        posicao: index + 1,
      };
    });

    // Aplicar paginação
    const paginatedBairros = rankingBairros.slice(params.offset, params.offset + params.limit);

    return {
      data: paginatedBairros,
      pagination: {
        total: rankingBairros.length,
        limit: params.limit,
        offset: params.offset,
        hasNext: params.offset + params.limit < rankingBairros.length,
        hasPrev: params.offset > 0,
      },
      cidade: cidade,
      estado: estado,
    };
  }
}
