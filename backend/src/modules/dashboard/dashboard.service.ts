import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bairro } from '../../shared/schemas/bairro.schema';
import { Conquista } from '../../shared/schemas/conquista.schema';
import { Jogo } from '../../shared/schemas/jogo.schema';
import { Palpite } from '../../shared/schemas/palpite.schema';
import { User } from '../../shared/schemas/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Jogo.name) private jogoModel: Model<Jogo>,
    @InjectModel(Palpite.name) private palpiteModel: Model<Palpite>,
    @InjectModel(Conquista.name) private conquistaModel: Model<Conquista>,
    @InjectModel(Bairro.name) private bairroModel: Model<Bairro>
  ) {}

  async getDashboardStats(userId: string) {
    try {
      // Buscar dados do usuário
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar palpites do usuário
      const palpites = await this.palpiteModel.find({ userId: userId }).exec();
      const palpitesHoje = await this.palpiteModel
        .find({
          userId: userId,
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        })
        .exec();

      // Calcular estatísticas de palpites
      const totalPalpites = palpites.length;
      const palpitesCorretos = palpites.filter((p) => p.acertouResultado || p.acertouPlacar).length;
      const taxaAcerto = totalPalpites > 0 ? (palpitesCorretos / totalPalpites) * 100 : 0;

      // Buscar jogos de hoje e próximos
      const hoje = new Date();
      const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);

      const jogosHoje = await this.jogoModel
        .find({
          data: {
            $gte: new Date(hoje.setHours(0, 0, 0, 0)),
            $lt: new Date(hoje.setHours(23, 59, 59, 999)),
          },
        })
        .exec();

      const proximosJogos = await this.jogoModel
        .find({
          data: { $gte: hoje, $lte: amanha },
          status: 'aberto',
        })
        .limit(5)
        .sort({ data: 1 })
        .exec();

      // Calcular posição no ranking (simplificado)
      const todosUsuarios = await this.userModel.find().sort({ totalPoints: -1 }).exec();
      const posicaoGeral = todosUsuarios.findIndex((u) => u._id.toString() === userId) + 1;

      // Buscar usuários do mesmo bairro para ranking local
      const usuariosBairro = await this.userModel
        .find({
          bairro: user.bairro,
          cidade: user.cidade,
          estado: user.estado,
        })
        .sort({ totalPoints: -1 })
        .exec();
      const posicaoBairro = usuariosBairro.findIndex((u) => u._id.toString() === userId) + 1;

      // Calcular sequência atual
      const sequenciaAtual = this.calcularSequenciaAtual(palpites);

      // Buscar conquistas desbloqueadas (usando medals)
      const conquistasUsuario = user.medals || [];

      return {
        usuario: {
          pontos_totais: user.totalPoints || 0,
          moedas: user.moedas || 0,
          nivel: Math.floor((user.totalPoints || 0) / 1000) + 1, // Calcular nível baseado em pontos
          posicao_ranking: posicaoGeral,
          sequencia_atual: sequenciaAtual,
          palpites_hoje: palpitesHoje.length,
        },
        palpites: {
          total_palpites: totalPalpites,
          palpites_corretos: palpitesCorretos,
          taxa_acerto: Math.round(taxaAcerto * 100) / 100,
          pontos_ganhos_mes: this.calcularPontosGanhosMes(palpites),
          melhor_sequencia: this.calcularMelhorSequencia(palpites),
        },
        jogos: {
          jogos_hoje: jogosHoje.length,
          jogos_proximos: proximosJogos.length,
          proximos_jogos: proximosJogos.map((jogo) => ({
            _id: jogo._id,
            time_casa: jogo.timeA.nome,
            time_visitante: jogo.timeB.nome,
            data_hora: jogo.data,
            campeonato: jogo.campeonato,
            status: jogo.status,
          })),
        },
        ranking: {
          posicao_geral: posicaoGeral,
          posicao_bairro: posicaoBairro,
          top_5_bairro: usuariosBairro.slice(0, 5).map((u, index) => ({
            usuario: u._id.toString(),
            nome: u.nome,
            pontos: u.totalPoints || 0,
            posicao: index + 1,
          })),
        },
        conquistas: {
          conquistas_desbloqueadas: conquistasUsuario.length,
          proximas_conquistas: await this.getProximasConquistas(userId),
        },
      };
    } catch (error) {
      console.error('Erro ao buscar dashboard stats:', error);
      throw error;
    }
  }

  async getJogosDestaque() {
    const hoje = new Date();
    const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);

    return await this.jogoModel
      .find({
        data: { $gte: hoje, $lte: amanha },
        status: 'aberto',
      })
      .limit(3)
      .sort({ data: 1 })
      .exec();
  }

  async getPalpitesRecentes(userId: string, limite: number = 5) {
    return await this.palpiteModel
      .find({ userId: userId })
      .populate('jogoId')
      .sort({ createdAt: -1 })
      .limit(limite)
      .exec();
  }

  async getAtividadeBairro(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.bairro || !user.cidade || !user.estado) return [];

    // Buscar atividade recente do bairro (últimos palpites)
    const atividadeRecente = await this.palpiteModel
      .find({
        userId: {
          $in: await this.userModel
            .find({
              bairro: user.bairro,
              cidade: user.cidade,
              estado: user.estado,
            })
            .select('_id'),
        },
      })
      .populate('userId', 'nome')
      .populate('jogoId')
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return atividadeRecente.map((atividade) => ({
      usuario: (atividade.userId as any)?.nome || 'Usuário',
      acao: `Fez um palpite`,
      timestamp: atividade.createdAt,
      pontos: atividade.pontos || 0,
    }));
  }

  async getMissoesAtivas(userId: string) {
    // Missões simplificadas baseadas na atividade do usuário
    const user = await this.userModel.findById(userId).exec();
    const palpitesHoje = await this.palpiteModel
      .find({
        userId: userId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      })
      .exec();

    const palpitesSemana = await this.palpiteModel
      .find({
        userId: userId,
        createdAt: {
          $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      })
      .exec();

    return [
      {
        id: 'palpites_diarios',
        nome: 'Palpites Diários',
        descricao: 'Faça 3 palpites hoje',
        tipo: 'diaria',
        progresso: palpitesHoje.length,
        meta: 3,
        recompensa_moedas: 50,
        recompensa_pontos: 10,
        data_expiracao: new Date(new Date().setHours(23, 59, 59, 999)),
        completada: palpitesHoje.length >= 3,
      },
      {
        id: 'palpites_semanais',
        nome: 'Palpites Semanais',
        descricao: 'Faça 10 palpites esta semana',
        tipo: 'semanal',
        progresso: palpitesSemana.length,
        meta: 10,
        recompensa_moedas: 200,
        recompensa_pontos: 50,
        data_expiracao: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        completada: palpitesSemana.length >= 10,
      },
    ];
  }

  async getConquistasDisponiveis(userId: string) {
    const conquistas = await this.conquistaModel.find().exec();
    const user = await this.userModel.findById(userId).exec();
    const conquistasUsuario = user.medals || [];

    return conquistas.map((conquista) => ({
      id: conquista._id.toString(),
      nome: conquista.nome,
      descricao: conquista.descricao,
      categoria: conquista.categoria,
      progresso: 0, // Implementar lógica de progresso
      meta: 100, // Valor padrão
      recompensa: 'Medalha especial',
      icone: 'pi-trophy',
      desbloqueada: conquistasUsuario.includes(conquista.nome),
    }));
  }

  async getProgressoSemanal(userId: string) {
    const ultimosSete = [];
    const pontosDiarios = [];
    const palpitesDiarios = [];

    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      ultimosSete.push(data.toISOString().split('T')[0]);

      const palpitesDia = await this.palpiteModel
        .find({
          userId: userId,
          createdAt: {
            $gte: new Date(data.setHours(0, 0, 0, 0)),
            $lt: new Date(data.setHours(23, 59, 59, 999)),
          },
        })
        .exec();

      palpitesDiarios.push(palpitesDia.length);
      pontosDiarios.push(palpitesDia.reduce((sum, p) => sum + (p.pontos || 0), 0));
    }

    return {
      dias: ultimosSete,
      palpites: palpitesDiarios,
      pontos: pontosDiarios,
      meta_semanal: 50,
      progresso_meta: pontosDiarios.reduce((a, b) => a + b, 0),
    };
  }

  async getNotificacoes(userId: string) {
    // Implementar sistema de notificações
    return [];
  }

  async getResumoDiario(userId: string) {
    const hoje = new Date();
    const palpitesHoje = await this.palpiteModel
      .find({
        userId: userId,
        createdAt: {
          $gte: new Date(hoje.setHours(0, 0, 0, 0)),
          $lt: new Date(hoje.setHours(23, 59, 59, 999)),
        },
      })
      .exec();

    const pontosHoje = palpitesHoje.reduce((sum, p) => sum + (p.pontos || 0), 0);

    return {
      data: hoje,
      palpites_realizados: palpitesHoje.length,
      pontos_ganhos: pontosHoje,
      posicao_dia: 1, // Implementar ranking diário
      melhor_palpite:
        palpitesHoje.length > 0
          ? {
              jogo: `Jogo ${palpitesHoje[0].jogoId}`,
              pontos: Math.max(...palpitesHoje.map((p) => p.pontos || 0)),
            }
          : null,
      jogos_disponiveis: await this.jogoModel.countDocuments({
        data: {
          $gte: new Date(hoje.setHours(0, 0, 0, 0)),
          $lt: new Date(hoje.setHours(23, 59, 59, 999)),
        },
        status: 'aberto',
      }),
    };
  }

  private calcularSequenciaAtual(palpites: any[]): number {
    // Ordenar palpites por data (mais recente primeiro)
    const palpitesOrdenados = palpites
      .filter((p) => p.acertouResultado !== undefined || p.acertouPlacar !== undefined)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let sequencia = 0;
    for (const palpite of palpitesOrdenados) {
      if (palpite.acertouResultado || palpite.acertouPlacar) {
        sequencia++;
      } else {
        break;
      }
    }
    return sequencia;
  }

  private calcularMelhorSequencia(palpites: any[]): number {
    const palpitesOrdenados = palpites
      .filter((p) => p.acertouResultado !== undefined || p.acertouPlacar !== undefined)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let melhorSequencia = 0;
    let sequenciaAtual = 0;

    for (const palpite of palpitesOrdenados) {
      if (palpite.acertouResultado || palpite.acertouPlacar) {
        sequenciaAtual++;
        melhorSequencia = Math.max(melhorSequencia, sequenciaAtual);
      } else {
        sequenciaAtual = 0;
      }
    }
    return melhorSequencia;
  }

  private calcularPontosGanhosMes(palpites: any[]): number {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    return palpites
      .filter((p) => new Date(p.createdAt) >= inicioMes)
      .reduce((sum, p) => sum + (p.pontos || 0), 0);
  }

  private async getProximasConquistas(userId: string) {
    // Implementar lógica de próximas conquistas
    return [
      {
        nome: 'Primeira Vitória',
        descricao: 'Acerte seu primeiro palpite',
        progresso: 0,
        meta: 1,
      },
    ];
  }
}
