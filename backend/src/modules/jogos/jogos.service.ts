import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    private footballApiService: FootballApiService,
  ) {}

  async findAll(): Promise<JogoDocument[]> {
    return this.jogoModel.find().populate('rodadaId').sort({ data: 1 }).exec();
  }

  async findByRodada(rodadaId: string): Promise<JogoDocument[]> {
    return this.jogoModel.find({ rodadaId }).populate('rodadaId').sort({ data: 1 }).exec();
  }

  async findById(id: string): Promise<JogoDocument> {
    return this.jogoModel.findById(id).populate('rodadaId').exec();
  }

  async findByCodigoAPI(codigoAPI: number): Promise<JogoDocument> {
    return this.jogoModel.findOne({ codigoAPI }).exec();
  }

  async create(createJogoDto: Partial<Jogo>): Promise<JogoDocument> {
    const createdJogo = new this.jogoModel(createJogoDto);
    return createdJogo.save();
  }

  async updateResultado(id: string, resultado: any): Promise<JogoDocument> {
    return this.jogoModel.findByIdAndUpdate(
      id,
      { 
        resultado,
        status: 'encerrado'
      },
      { new: true }
    ).exec();
  }

  async findJogosAbertos(): Promise<JogoDocument[]> {
    return this.jogoModel.find({ 
      status: 'aberto',
      data: { $gt: new Date() }
    }).populate('rodadaId').exec();
  }

  async findJogosParaProcessar(): Promise<JogoDocument[]> {
    return this.jogoModel.find({
      status: 'aberto',
      data: { $lt: new Date() }
    }).exec();
  }

  async findByData(data: string): Promise<JogoDocument[]> {
    // Converte a string da data (YYYY-MM-DD) para início e fim do dia UTC
    const startDate = new Date(data + 'T00:00:00.000Z');
    const endDate = new Date(data + 'T23:59:59.999Z');
    
    // Para buscar jogos, vamos buscar da data solicitada até 30 dias no futuro
    const dataFim = new Date(data);
    dataFim.setDate(dataFim.getDate() + 30);
    const endDateRange = new Date(dataFim.toISOString().split('T')[0] + 'T23:59:59.999Z');
    
    let jogos = await this.jogoModel.find({
      data: {
        $gte: startDate,
        $lte: endDateRange // Busca até 30 dias no futuro
      }
    }).populate('rodadaId').sort({ data: 1 }).exec();

    // Verifica se precisa sincronizar (verifica apenas para a data específica solicitada)
    const precisaSincronizar = await this.verificaSeNecessitaSincronizacao(data);
    
    if (jogos.length === 0 || precisaSincronizar) {
      try {
        // Sincroniza jogos da data solicitada até 30 dias no futuro
        await this.sincronizarJogosRangeDaAPI(data, 30);
        
        // Busca novamente após sincronização (agora busca o range completo)
        jogos = await this.jogoModel.find({
          data: {
            $gte: startDate,
            $lte: endDateRange
          }
        }).populate('rodadaId').sort({ data: 1 }).exec();
      } catch (error) {
        console.error('Erro ao sincronizar jogos:', error);
        // Registra o erro na sincronização
        await this.registrarSincronizacao(data, 'erro', 0, error.message);
      }
    }

    return jogos;
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
      
      this.logger.log(`Sincronização concluída - Novos: ${jogosNovos}, Rejeitados: ${jogosRejeitados}`);
      
      // Registra a sincronização bem-sucedida
      await this.registrarSincronizacao(data, 'sucesso', jogosAPI.length - jogosRejeitados);
      
    } catch (error) {
      throw error; // Relança o erro para ser tratado no método pai
    }
  }

  async sincronizarJogosRangeDaAPI(dataInicial: string, diasNoFuturo: number = 30): Promise<void> {
    try {
      const apiResponse = await this.footballApiService.buscarJogosEmRange(dataInicial, diasNoFuturo);
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
      
      this.logger.log(`Sincronização range concluída - Novos: ${jogosNovos}, Rejeitados: ${jogosRejeitados}`);
      
      // Registra a sincronização bem-sucedida
      await this.registrarSincronizacao(dataInicial, 'sucesso', jogosAPI.length - jogosRejeitados);
      
    } catch (error) {
      throw error; // Relança o erro para ser tratado no método pai
    }
  }

  private async atualizarJogoExistente(jogoExistente: JogoDocument, dadosNovos: any): Promise<void> {
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
    await this.sincronizacaoModel.findOneAndUpdate(
      { data },
      {
        data,
        ultimaSincronizacao: new Date(),
        totalJogos,
        status,
        erroDetalhes
      },
      { upsert: true, new: true }
    ).exec();
  }

  async forcarSincronizacao(data: string): Promise<{ message: string; totalJogos: number; status: string }> {
    try {
      const startDate = new Date(data + 'T00:00:00.000Z');
      const endDate = new Date(data + 'T23:59:59.999Z');
      
      await this.sincronizarJogosDaAPI(data);
      
      const jogos = await this.jogoModel.find({
        data: {
          $gte: startDate,
          $lte: endDate
        }
      }).exec();
      
      return {
        message: 'Sincronização forçada executada com sucesso',
        totalJogos: jogos.length,
        status: 'sucesso'
      };
    } catch (error) {
      await this.registrarSincronizacao(data, 'erro', 0, error.message);
      return {
        message: 'Erro na sincronização forçada',
        totalJogos: 0,
        status: 'erro'
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
    throw new Error('Criação de jogos fictícios foi desabilitada. Apenas jogos reais são permitidos.');
  }

  private validarJogoReal(jogo: any): boolean {
    // Verifica se é um jogo com código API válido (não fake)
    if (!jogo.codigoAPI || jogo.codigoAPI.toString().startsWith('999')) {
      this.logger.warn(`Jogo rejeitado - código API suspeito: ${jogo.codigoAPI}`);
      return false;
    }

    // Verifica se a data do jogo está dentro do limite permitido (até 30 dias no futuro)
    const dataJogo = new Date(jogo.data);
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + 30);
    
    // Permite jogos de até 30 dias no passado (para jogos já realizados) até 30 dias no futuro
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

    return true;
  }

  async findByDataComCampeonatos(dataInicial: string, diasNoFuturo: number = 7): Promise<any> {
    try {
      // Calcula o range de datas
      const startDate = new Date(dataInicial + 'T00:00:00.000Z');
      const endDate = new Date(dataInicial);
      endDate.setDate(endDate.getDate() + diasNoFuturo);
      const endDateRange = new Date(endDate.toISOString().split('T')[0] + 'T23:59:59.999Z');
      
      // Busca jogos do MongoDB no range de datas
      const jogos = await this.jogoModel.find({
        data: {
          $gte: startDate,
          $lte: endDateRange
        }
      }).populate('rodadaId').sort({ data: 1 }).exec();

      // Organiza os jogos por campeonato
      const jogosPorCampeonato = {};
      
      for (const jogo of jogos) {
        const campeonato = jogo.campeonato || 'Outros';
        
        if (!jogosPorCampeonato[campeonato]) {
          jogosPorCampeonato[campeonato] = {
            nome: campeonato,
            jogos: [],
            total: 0
          };
        }
        
        jogosPorCampeonato[campeonato].jogos.push(jogo);
        jogosPorCampeonato[campeonato].total++;
      }

      // Converte para array e ordena por relevância
      const campeonatos = Object.values(jogosPorCampeonato);
      
      // Ordena por relevância (campeonatos brasileiros primeiro)
      campeonatos.sort((a: any, b: any) => {
        const prioridadeBrasileiros = ['Brasileirão Serie A', 'Copa do Brasil', 'Campeonato Carioca', 'Copa Libertadores'];
        const prioridadeA = prioridadeBrasileiros.indexOf(a.nome);
        const prioridadeB = prioridadeBrasileiros.indexOf(b.nome);
        
        if (prioridadeA !== -1 && prioridadeB !== -1) {
          return prioridadeA - prioridadeB;
        }
        if (prioridadeA !== -1) return -1;
        if (prioridadeB !== -1) return 1;
        
        return a.nome.localeCompare(b.nome);
      });

      this.logger.log(`Jogos encontrados no MongoDB organizados em ${campeonatos.length} campeonatos`);
      campeonatos.forEach((campeonato: any) => {
        this.logger.log(`- ${campeonato.nome}: ${campeonato.total} jogos`);
      });
      
      return {
        totalCampeonatos: campeonatos.length,
        totalJogos: campeonatos.reduce((acc: number, c: any) => acc + c.total, 0),
        campeonatos,
        periodo: {
          dataInicial,
          dataFinal: endDate.toISOString().split('T')[0]
        }
      };
      
    } catch (error) {
      this.logger.error(`Erro ao buscar jogos por campeonatos para ${dataInicial}:`, error.message);
      return {
        totalCampeonatos: 0,
        totalJogos: 0,
        campeonatos: [],
        periodo: { dataInicial, dataFinal: dataInicial }
      };
    }
  }
}
