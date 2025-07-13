import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Jogo, JogoDocument } from '../../shared/schemas/jogo.schema';
import { Sincronizacao, SincronizacaoDocument } from '../../shared/schemas/sincronizacao.schema';
import { FootballApiService } from '../football-api/football-api.service';

@Injectable()
export class JogosService {
  private readonly TTL_HORAS = 12; // TTL de 12 horas
  private readonly logger = new Logger(JogosService.name);

  constructor(
    @InjectModel(Jogo.name) private jogoModel: Model<JogoDocument>,
    @InjectModel(Sincronizacao.name) private sincronizacaoModel: Model<SincronizacaoDocument>,
    private footballApiService: FootballApiService
  ) {}

  /**
   * Adiciona o ID do palpite ao array de palpites do jogo
   */
  async addPalpiteToJogo(jogoId: string, palpiteId: string): Promise<void> {
    await this.jogoModel
      .findByIdAndUpdate(jogoId, { $addToSet: { palpites: palpiteId } }, { new: true })
      .exec();
  }

  async findAll(): Promise<JogoDocument[]> {
    return this.jogoModel.find().populate('rodadaId').populate('palpites').sort({ data: 1 }).exec();
  }

  async findByRodada(rodadaId: string): Promise<JogoDocument[]> {
    return this.jogoModel
      .find({ rodadaId })
      .populate('rodadaId')
      .populate('palpites')
      .sort({ data: 1 })
      .exec();
  }

  async findById(id: string): Promise<JogoDocument> {
    return this.jogoModel.findById(id).populate('rodadaId').populate('palpites').exec();
  }

  async findByCodigoAPI(codigoAPI: number): Promise<JogoDocument> {
    return this.jogoModel.findOne({ codigoAPI }).exec();
  }

  async create(createJogoDto: Partial<Jogo>): Promise<JogoDocument> {
    const createdJogo = new this.jogoModel(createJogoDto);
    return createdJogo.save();
  }

  async updateResultado(id: string, resultado: any): Promise<JogoDocument> {
    return this.jogoModel
      .findByIdAndUpdate(
        id,
        {
          resultado,
          status: 'encerrado',
        },
        { new: true }
      )
      .exec();
  }

  async findJogosAbertos(): Promise<JogoDocument[]> {
    return this.jogoModel
      .find({
        status: 'aberto',
        data: { $gt: new Date() },
      })
      .populate('rodadaId')
      .exec();
  }

  async findJogosParaProcessar(): Promise<JogoDocument[]> {
    return this.jogoModel
      .find({
        status: { $in: ['aberto', 'encerrado'] },
        data: { $lt: new Date() },
      })
      .exec();
  }

  async findByData(data: string): Promise<any> {
    // Usa o método que organiza por campeonatos para retornar dados estruturados
    return this.findByDataComCampeonatos(data, 60); // 60 dias para incluir mais jogos
  }

  private async verificaSeNecessitaSincronizacao(data: string): Promise<boolean> {
    const sincronizacao = await this.sincronizacaoModel.findOne({ data }).exec();

    if (!sincronizacao) {
      return true; // Nunca foi sincronizado
    }

    const agora = new Date();
    const ultimaSincronizacao = new Date(sincronizacao.ultimaSincronizacao);
    const diferencaHoras = (agora.getTime() - ultimaSincronizacao.getTime()) / (1000 * 60 * 60);

    return diferencaHoras >= this.TTL_HORAS;
  }

  private async sincronizarJogosDaAPI(data: string): Promise<void> {
    try {
      const apiResponse = await this.footballApiService.getJogosPorData(data);
      const jogosAPI = this.footballApiService.transformarJogosAPI(apiResponse.matches || []);

      let jogosNovos = 0;
      let jogosRejeitados = 0;

      // Salva apenas jogos válidos no banco para futuras consultas
      for (const jogoAPI of jogosAPI) {
        // Validar se é um jogo real antes de processar
        if (!this.validarJogoReal(jogoAPI)) {
          jogosRejeitados++;
          continue;
        }

        // Verifica se já existe pelo codigoAPI
        const existe = await this.findByCodigoAPI(jogoAPI.codigoAPI);
        if (!existe) {
          const novoJogo = {
            ...jogoAPI,
            rodadaId: null, // Será definido quando implementarmos as rodadas
          };
          await this.create(novoJogo);
          jogosNovos++;
        } else {
          // Atualiza dados do jogo existente (horário, status, etc.)
          await this.atualizarJogoExistente(existe, jogoAPI);
        }
      }

      this.logger.log(
        `Sincronização concluída - Novos: ${jogosNovos}, Rejeitados: ${jogosRejeitados}`
      );

      // Registra a sincronização bem-sucedida
      await this.registrarSincronizacao(data, 'sucesso', jogosAPI.length - jogosRejeitados);
    } catch (error) {
      throw error; // Relança o erro para ser tratado no método pai
    }
  }

  async sincronizarJogosRangeDaAPI(dataInicial: string, diasNoFuturo: number = 30): Promise<void> {
    try {
      const apiResponse = await this.footballApiService.buscarJogosEmRange(
        dataInicial,
        diasNoFuturo
      );
      const jogosAPI = this.footballApiService.transformarJogosAPI(apiResponse.matches || []);

      let jogosNovos = 0;
      let jogosRejeitados = 0;

      // Salva apenas jogos válidos no banco para futuras consultas
      for (const jogoAPI of jogosAPI) {
        // Validar se é um jogo real antes de processar
        if (!this.validarJogoReal(jogoAPI)) {
          jogosRejeitados++;
          continue;
        }

        // Verifica se já existe pelo codigoAPI
        const existe = await this.findByCodigoAPI(jogoAPI.codigoAPI);
        if (!existe) {
          const novoJogo = {
            ...jogoAPI,
            rodadaId: null, // Será definido quando implementarmos as rodadas
          };
          await this.create(novoJogo);
          jogosNovos++;
        } else {
          // Atualiza dados do jogo existente (horário, status, etc.)
          await this.atualizarJogoExistente(existe, jogoAPI);
        }
      }

      this.logger.log(
        `Sincronização range concluída - Novos: ${jogosNovos}, Rejeitados: ${jogosRejeitados}`
      );

      // Registra a sincronização bem-sucedida
      await this.registrarSincronizacao(dataInicial, 'sucesso', jogosAPI.length - jogosRejeitados);
    } catch (error) {
      throw error; // Relança o erro para ser tratado no método pai
    }
  }

  private async atualizarJogoExistente(
    jogoExistente: JogoDocument,
    dadosNovos: any
  ): Promise<void> {
    // Atualiza apenas campos que podem ter mudado
    const camposParaAtualizar: any = {};

    if (jogoExistente.data.getTime() !== new Date(dadosNovos.data).getTime()) {
      camposParaAtualizar.data = dadosNovos.data;
    }

    if (jogoExistente.status !== dadosNovos.status) {
      camposParaAtualizar.status = dadosNovos.status;
    }

    if (jogoExistente.campeonato !== dadosNovos.campeonato) {
      camposParaAtualizar.campeonato = dadosNovos.campeonato;
    }

    // Se há campos para atualizar, executa a atualização
    if (Object.keys(camposParaAtualizar).length > 0) {
      await this.jogoModel.findByIdAndUpdate(jogoExistente._id, camposParaAtualizar).exec();
    }
  }

  private async registrarSincronizacao(
    data: string,
    status: 'sucesso' | 'erro' | 'sem_dados',
    totalJogos: number = 0,
    erroDetalhes?: string
  ): Promise<void> {
    await this.sincronizacaoModel
      .findOneAndUpdate(
        { data },
        {
          data,
          ultimaSincronizacao: new Date(),
          totalJogos,
          status,
          erroDetalhes,
        },
        { upsert: true, new: true }
      )
      .exec();
  }

  async forcarSincronizacao(
    data: string
  ): Promise<{ message: string; totalJogos: number; status: string }> {
    try {
      // Usar timezone local ao invés de UTC
      const startDate = new Date(data + 'T00:00:00');
      const endDate = new Date(data + 'T23:59:59.999');

      await this.sincronizarJogosDaAPI(data);

      const jogos = await this.jogoModel
        .find({
          data: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .exec();

      return {
        message: 'Sincronização forçada executada com sucesso',
        totalJogos: jogos.length,
        status: 'sucesso',
      };
    } catch (error) {
      await this.registrarSincronizacao(data, 'erro', 0, error.message);
      return {
        message: 'Erro na sincronização forçada',
        totalJogos: 0,
        status: 'erro',
      };
    }
  }

  async obterStatusSincronizacao(data: string): Promise<SincronizacaoDocument | null> {
    return this.sincronizacaoModel.findOne({ data }).exec();
  }

  async testarJogosBrasileiros() {
    return this.footballApiService.buscarJogosBrasileirosHoje();
  }

  // Método removido para evitar criação de jogos fictícios
  // Apenas jogos reais da API externa devem ser salvos no banco de dados
  async criarJogosExemplo() {
    throw new Error(
      'Criação de jogos fictícios foi desabilitada. Apenas jogos reais são permitidos.'
    );
  }

  private validarJogoReal(jogo: any): boolean {
    // Verifica se é um jogo com código API válido (não fake)
    if (!jogo.codigoAPI || jogo.codigoAPI.toString().startsWith('999')) {
      this.logger.warn(`Jogo rejeitado - código API suspeito: ${jogo.codigoAPI}`);
      return false;
    }

    // Para sincronização global de 60 dias, permite jogos até 90 dias no futuro
    const dataJogo = new Date(jogo.data);
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + 90); // Aumentado para 90 dias

    // Permite jogos de até 30 dias no passado (para jogos já realizados) até 90 dias no futuro
    const dataMinima = new Date();
    dataMinima.setDate(hoje.getDate() - 30);

    if (dataJogo < dataMinima || dataJogo > dataLimite) {
      this.logger.warn(`Jogo rejeitado - data fora do limite permitido: ${dataJogo.toISOString()}`);
      return false;
    }

    // Verifica se tem times válidos
    if (!jogo.timeA?.nome || !jogo.timeB?.nome) {
      this.logger.warn('Jogo rejeitado - times inválidos');
      return false;
    }

    // Para sincronização global, aceita QUALQUER campeonato (não apenas Brasileiro)
    // Remove filtro de campeonato para permitir todos os jogos
    return true;
  }

  private validarJogoRealParaSincronizacaoGlobal(jogo: any): boolean {
    // Verifica se é um jogo com código API válido (não fake)
    if (!jogo.codigoAPI || jogo.codigoAPI.toString().startsWith('999')) {
      this.logger.warn(`Jogo rejeitado - código API suspeito: ${jogo.codigoAPI}`);
      return false;
    }

    // Para sincronização global, permite qualquer jogo dentro de um range maior (até 90 dias)
    const dataJogo = new Date(jogo.data);
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + 90); // 90 dias no futuro para sincronização global

    // Permite jogos de até 30 dias no passado até 90 dias no futuro
    const dataMinima = new Date();
    dataMinima.setDate(hoje.getDate() - 30);

    if (dataJogo < dataMinima || dataJogo > dataLimite) {
      this.logger.warn(`[GLOBAL] Jogo rejeitado - data fora do limite: ${dataJogo.toISOString()}`);
      return false;
    }

    // Verifica se tem times válidos
    if (!jogo.timeA?.nome || !jogo.timeB?.nome) {
      this.logger.warn('[GLOBAL] Jogo rejeitado - times inválidos');
      return false;
    }

    // Aceita QUALQUER campeonato para sincronização global
    this.logger.log(
      `[GLOBAL] Jogo válido aceito: ${jogo.timeA.nome} vs ${jogo.timeB.nome} - ${jogo.campeonato}`
    );
    return true;
  }
  async findByDataComCampeonatos(
    dataInicial: string,
    diasNoFuturo: number = 7,
    userId?: string
  ): Promise<any> {
    try {
      this.logger.log(`🔍 Buscando jogos a partir de: ${dataInicial} por ${diasNoFuturo} dias`);

      // Busca TODOS os jogos do MongoDB primeiro (sem filtro de data)
      const populateOptions = {
        path: 'palpites',
        model: 'Palpite',
        // Se userId foi fornecido, filtra apenas os palpites do usuário
        ...(userId && {
          match: { userId: new Types.ObjectId(userId) },
        }),
      };

      const todosJogos = await this.jogoModel
        .find({})
        .populate('rodadaId')
        .populate(populateOptions)
        .exec();

      // Organiza os jogos por campeonato
      const jogosPorCampeonato = {};

      for (const jogo of todosJogos) {
        const campeonato = jogo.campeonato || 'Outros';

        if (!jogosPorCampeonato[campeonato]) {
          jogosPorCampeonato[campeonato] = {
            nome: campeonato,
            jogos: [],
            total: 0,
          };
        }

        jogosPorCampeonato[campeonato].jogos.push(jogo);
        jogosPorCampeonato[campeonato].total++;
      }

      // Converte para array
      const campeonatos = Object.values(jogosPorCampeonato);

      this.logger.log(`🏆 Campeonatos encontrados: ${campeonatos.length}`);
      campeonatos.forEach((campeonato: any) => {
        this.logger.log(`- ${campeonato.nome}: ${campeonato.total} jogos`);
      });

      return {
        totalCampeonatos: campeonatos.length,
        totalJogos: campeonatos.reduce((acc: number, c: any) => acc + c.total, 0),
        campeonatos,
        periodo: {
          dataInicial,
          dataFinal: new Date(dataInicial).toISOString().split('T')[0],
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar jogos por campeonatos para ${dataInicial}:`,
        error.message
      );
      return {
        totalCampeonatos: 0,
        totalJogos: 0,
        campeonatos: [],
        periodo: { dataInicial, dataFinal: dataInicial },
      };
    }
  }

  async sincronizarJogos60DiasComCampeonatos(dataInicial: string): Promise<{
    totalJogosSalvos: number;
    totalCampeonatos: number;
    jogosPorCampeonato: { [campeonato: string]: number };
    periodosProcessados: number;
    estatisticas: {
      jogosNovos: number;
      jogosAtualizados: number;
      jogosRejeitados: number;
      erros: number;
    };
  }> {
    const DIAS_POR_PERIODO = 10; // Dividir em períodos de 10 dias para respeitar limites da API
    const TOTAL_DIAS = 60;
    const TOTAL_PERIODOS = TOTAL_DIAS / DIAS_POR_PERIODO; // 6 períodos

    let totalJogosSalvos = 0;
    let periodosProcessados = 0;
    const jogosPorCampeonato: { [campeonato: string]: number } = {};
    const estatisticas = {
      jogosNovos: 0,
      jogosAtualizados: 0,
      jogosRejeitados: 0,
      erros: 0,
    };

    this.logger.log(
      `🌍 Iniciando sincronização global de ${TOTAL_DIAS} dias em ${TOTAL_PERIODOS} períodos de ${DIAS_POR_PERIODO} dias cada`
    );

    const dataAtual = new Date(dataInicial);

    for (let periodo = 0; periodo < TOTAL_PERIODOS; periodo++) {
      const dataInicioPeriodo = new Date(dataAtual);
      dataInicioPeriodo.setDate(dataAtual.getDate() + periodo * DIAS_POR_PERIODO);

      const dataFimPeriodo = new Date(dataInicioPeriodo);
      dataFimPeriodo.setDate(dataInicioPeriodo.getDate() + DIAS_POR_PERIODO - 1);

      const dataInicioStr = dataInicioPeriodo.toISOString().split('T')[0];
      const dataFimStr = dataFimPeriodo.toISOString().split('T')[0];

      this.logger.log(
        `📅 Período ${periodo + 1}/${TOTAL_PERIODOS}: ${dataInicioStr} até ${dataFimStr}`
      );

      try {
        // Buscar jogos da API para este período usando o método sem filtros
        const apiResponse = await this.footballApiService.buscarTodosJogosEmRange(
          dataInicioStr,
          DIAS_POR_PERIODO
        );

        if (!apiResponse || !apiResponse.matches) {
          this.logger.warn(
            `⚠️ Nenhum jogo encontrado para o período ${dataInicioStr} - ${dataFimStr}`
          );
          continue;
        }

        const jogosAPI = this.footballApiService.transformarJogosAPI(apiResponse.matches);
        this.logger.log(`🔍 Encontrados ${jogosAPI.length} jogos no período ${periodo + 1}`);

        // Processar cada jogo encontrado
        for (const jogoAPI of jogosAPI) {
          try {
            // Validar se é um jogo real - para sincronização global, usa validação mais flexível
            if (!this.validarJogoRealParaSincronizacaoGlobal(jogoAPI)) {
              estatisticas.jogosRejeitados++;
              continue;
            }

            // Verificar se já existe pelo codigoAPI
            const jogoExistente = await this.findByCodigoAPI(jogoAPI.codigoAPI);

            if (!jogoExistente) {
              // Criar novo jogo
              const novoJogo = {
                ...jogoAPI,
                rodadaId: null, // Será definido quando implementarmos as rodadas
              };

              await this.create(novoJogo);
              estatisticas.jogosNovos++;
              totalJogosSalvos++;

              // Contar jogos por campeonato
              const campeonato = jogoAPI.campeonato || 'Sem Campeonato';
              jogosPorCampeonato[campeonato] = (jogosPorCampeonato[campeonato] || 0) + 1;

              this.logger.log(
                `✅ Novo jogo salvo: ${jogoAPI.timeA.nome} vs ${jogoAPI.timeB.nome} - ${campeonato}`
              );
            } else {
              // Atualizar jogo existente
              await this.atualizarJogoExistente(jogoExistente, jogoAPI);
              estatisticas.jogosAtualizados++;

              this.logger.log(`🔄 Jogo atualizado: ${jogoAPI.timeA.nome} vs ${jogoAPI.timeB.nome}`);
            }
          } catch (error) {
            estatisticas.erros++;
            this.logger.error(
              `❌ Erro ao processar jogo ${jogoAPI.timeA.nome} vs ${jogoAPI.timeB.nome}:`,
              error.message
            );
          }
        }

        periodosProcessados++;

        // Pequena pausa entre períodos para não sobrecarregar a API
        if (periodo < TOTAL_PERIODOS - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 segundo de pausa
        }
      } catch (error) {
        estatisticas.erros++;
        this.logger.error(
          `❌ Erro ao processar período ${periodo + 1} (${dataInicioStr} - ${dataFimStr}):`,
          error.message
        );
      }
    }

    const totalCampeonatos = Object.keys(jogosPorCampeonato).length;

    this.logger.log(`🎯 Sincronização global concluída:`);
    this.logger.log(`   📊 Total de jogos salvos: ${totalJogosSalvos}`);
    this.logger.log(`   🏆 Total de campeonatos: ${totalCampeonatos}`);
    this.logger.log(`   📅 Períodos processados: ${periodosProcessados}/${TOTAL_PERIODOS}`);
    this.logger.log(
      `   ✅ Novos: ${estatisticas.jogosNovos}, Atualizados: ${estatisticas.jogosAtualizados}`
    );
    this.logger.log(
      `   ❌ Rejeitados: ${estatisticas.jogosRejeitados}, Erros: ${estatisticas.erros}`
    );

    // Registrar a sincronização global
    await this.registrarSincronizacao(
      `${dataInicial}_60dias`,
      totalJogosSalvos > 0 ? 'sucesso' : 'sem_dados',
      totalJogosSalvos,
      estatisticas.erros > 0 ? `${estatisticas.erros} erros durante sincronização` : undefined
    );

    return {
      totalJogosSalvos,
      totalCampeonatos,
      jogosPorCampeonato,
      periodosProcessados,
      estatisticas,
    };
  }
}
