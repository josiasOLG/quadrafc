import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import { FootballApiService } from '../football-api/football-api.service';
import { JogosService } from './jogos.service';

@ApiTags('jogos')
@Controller('jogos')
export class JogosController {
  private readonly logger = new Logger(JogosController.name);

  constructor(
    private readonly jogosService: JogosService,
    private readonly footballApiService: FootballApiService
  ) {}

  @Get()
  @Public()
  @ResponseMessage('Jogos recuperados com sucesso')
  @ApiOperation({ summary: 'Listar todos os jogos' })
  @ApiQuery({ name: 'rodadaId', required: false, description: 'Filtrar por rodada' })
  async findAll(@Query('rodadaId') rodadaId?: string) {
    if (rodadaId) {
      return this.jogosService.findByRodada(rodadaId);
    }
    return this.jogosService.findAll();
  }

  @Get('abertos')
  @Public()
  @ResponseMessage('Jogos abertos recuperados com sucesso')
  @ApiOperation({ summary: 'Listar jogos abertos para palpites' })
  async findJogosAbertos() {
    return this.jogosService.findJogosAbertos();
  }

  @Get('data/:data')
  @Public()
  @ResponseMessage('Jogos da data organizados por campeonatos')
  @ApiOperation({ summary: 'Listar jogos de uma data específica organizados por campeonatos' })
  async findJogosByData(@Param('data') data: string) {
    return this.jogosService.findByDataComCampeonatos(data, 60); // 60 dias para pegar mais jogos
  }

  @Get('data/:data/campeonatos')
  @Public()
  @ResponseMessage('Jogos da data organizados por campeonatos')
  @ApiOperation({ summary: 'Listar jogos de uma data específica organizados por campeonatos' })
  async findJogosByDataComCampeonatos(@Param('data') data: string) {
    return this.footballApiService.getJogosPorDataComCampeonatos(data, true);
  }

  @Get('test/brasileiros')
  @Public()
  @ResponseMessage('Teste de jogos brasileiros executado')
  @ApiOperation({ summary: 'Testar busca de jogos com times brasileiros' })
  async testJogosBrasileiros() {
    return this.jogosService.testarJogosBrasileiros();
  }

  @Get('test/todas-competicoes/:data')
  @Public()
  @ResponseMessage('Teste de todas as competições executado')
  @ApiOperation({ summary: 'Testar busca de jogos em todas as competições' })
  async testTodasCompeticoes(@Param('data') data: string) {
    return this.footballApiService.buscarJogosTodasCompeticoes(data, 10);
  }

  // Endpoint removido para segurança - não permitimos mais criação de jogos fictícios
  // @Get('test/criar-exemplos')
  // @Public()
  // @ResponseMessage('Jogos de exemplo criados')
  // @ApiOperation({ summary: 'Criar jogos de exemplo para teste' })
  // async criarJogosExemplo() {
  //   return this.jogosService.criarJogosExemplo();
  // }

  @Get('debug/todos')
  @Public()
  @ResponseMessage('Todos os jogos no banco')
  @ApiOperation({ summary: 'Debug - listar todos os jogos' })
  async debugTodosJogos() {
    return this.jogosService.findAll();
  }

  @Get(':id')
  @Public()
  @ResponseMessage('Jogo recuperado com sucesso')
  @ApiOperation({ summary: 'Obter detalhes de um jogo específico' })
  async findOne(@Param('id') id: string) {
    return this.jogosService.findById(id);
  }

  @Post('sincronizar/:data')
  @Public()
  @ResponseMessage('Sincronização forçada executada')
  @ApiOperation({ summary: 'Forçar sincronização de jogos para uma data específica' })
  async forcarSincronizacao(@Param('data') data: string) {
    return this.jogosService.forcarSincronizacao(data);
  }

  @Get('sincronizacao/status/:data')
  @Public()
  @ResponseMessage('Status de sincronização recuperado')
  @ApiOperation({ summary: 'Obter status da última sincronização para uma data' })
  async obterStatusSincronizacao(@Param('data') data: string) {
    const status = await this.jogosService.obterStatusSincronizacao(data);
    if (!status) {
      return {
        data,
        status: 'nunca_sincronizado',
        message: 'Esta data nunca foi sincronizada',
      };
    }
    return status;
  }

  @Get('range/:dataInicial/:dias')
  @Public()
  @ResponseMessage('Jogos do range de datas recuperados com sucesso')
  @ApiOperation({
    summary: 'Buscar jogos em um range de datas (da data inicial até X dias no futuro)',
  })
  async findJogosByRange(@Param('dataInicial') dataInicial: string, @Param('dias') dias: string) {
    const diasNumber = parseInt(dias, 10);
    const dataFim = new Date(dataInicial + 'T00:00:00');
    dataFim.setDate(dataFim.getDate() + diasNumber);

    const startDate = new Date(dataInicial + 'T00:00:00');
    const endDate = new Date(dataFim.toISOString().split('T')[0] + 'T23:59:59.999');

    return this.jogosService.findAll().then((jogos) =>
      jogos.filter((jogo) => {
        const jogoDate = new Date(jogo.data);
        return jogoDate >= startDate && jogoDate <= endDate;
      })
    );
  }

  @Get('campeonatos/:dataInicial/:limite')
  @ResponseMessage('Jogos por campeonatos recuperados com sucesso')
  @ApiOperation({
    summary: 'Buscar jogos organizados por campeonatos com limite de quantidade de jogos',
  })
  async findJogosPorCampeonatos(
    @Param('dataInicial') dataInicial: string,
    @Param('limite') limite: string,
    @Request() req: any
  ) {
    const limiteNumber = parseInt(limite, 10);

    // Validação do limite
    if (isNaN(limiteNumber) || limiteNumber < 1) {
      throw new BadRequestException('O parâmetro "limite" deve ser um número válido maior que 0');
    }

    if (limiteNumber > 1000) {
      throw new BadRequestException('O limite máximo é de 1000 jogos');
    }

    this.logger.log(
      `🔍 Buscando até ${limiteNumber} jogos a partir de ${dataInicial} (próximos 60 dias)`
    );

    // Busca jogos organizados por campeonatos (usando 60 dias para pegar mais jogos disponíveis)
    // Passa o userId para filtrar apenas os palpites do usuário logado
    const userId = req.user?.id || req.user?.sub;
    const resultadoCompleto = await this.jogosService.findByDataComCampeonatos(
      dataInicial,
      60, // Busca em 60 dias para ter mais jogos disponíveis
      userId
    );

    // Aplica o limite de quantidade de jogos de forma sequencial pelos campeonatos
    let totalJogosLimitados = 0;
    const campeonatosLimitados = [];

    for (const campeonato of resultadoCompleto.campeonatos || []) {
      if (totalJogosLimitados >= limiteNumber) break;

      const jogosDisponiveis = campeonato.jogos || [];

      // Ordena os jogos por data antes de aplicar o limite
      const jogosOrdenados = jogosDisponiveis.sort((a, b) => {
        const dataA = new Date(a.data);
        const dataB = new Date(b.data);
        return dataA.getTime() - dataB.getTime();
      });

      const jogosRestantes = limiteNumber - totalJogosLimitados;
      const jogosLimitados = jogosOrdenados.slice(0, jogosRestantes);

      if (jogosLimitados.length > 0) {
        totalJogosLimitados += jogosLimitados.length;
        campeonatosLimitados.push({
          ...campeonato,
          jogos: jogosLimitados,
          total: jogosLimitados.length,
        });
      }
    }

    const resultado = {
      ...resultadoCompleto,
      campeonatos: campeonatosLimitados,
      totalJogos: totalJogosLimitados,
      totalCampeonatos: campeonatosLimitados.length,
      limiteAplicado: limiteNumber,
      periodoConsultado: '60 dias a partir da data inicial',
    };

    this.logger.log(
      `📊 Retornando ${resultado.totalJogos} jogos (limite: ${limiteNumber}) em ${resultado.totalCampeonatos} campeonatos`
    );

    // Se não encontrou jogos suficientes no MongoDB, retorna o que tem
    if (resultado.totalJogos === 0) {
      this.logger.log(
        `⚠️ Nenhum jogo encontrado no MongoDB a partir de ${dataInicial}. Use a sincronização global para populá-los.`
      );
    }

    return resultado;
  }

  @Get('campeonatos/hoje')
  @Public()
  @ResponseMessage('Jogos de hoje organizados por campeonatos')
  @ApiOperation({ summary: 'Buscar jogos de hoje organizados por campeonatos' })
  async findJogosHojePorCampeonatos() {
    const hoje = new Date().toISOString().split('T')[0];

    // Primeiro tenta buscar do MongoDB
    let resultado = await this.jogosService.findByDataComCampeonatos(hoje, 7);

    // Se não encontrou jogos no MongoDB, sincroniza da API externa e busca novamente
    if (resultado.totalJogos === 0) {
      await this.jogosService.sincronizarJogosRangeDaAPI(hoje, 7);
      resultado = await this.jogosService.findByDataComCampeonatos(hoje, 7);
    }

    return resultado;
  }

  @Get('debug/competicoes-disponiveis')
  @Public()
  @ResponseMessage('Competições disponíveis na API')
  @ApiOperation({ summary: 'Listar todas as competições disponíveis na API externa' })
  async debugCompeticoesDisponiveis() {
    return this.footballApiService.listarCompeticoes();
  }

  // Executa uma vez por dia às 04:00 para sincronizar jogos dos próximos 60 dias
  @Cron('0 4 * * *', {
    name: 'sincronizar-global-60-dias',
    timeZone: 'America/Sao_Paulo',
  })
  @Post('sincronizar-global-60-dias')
  @Public()
  @ResponseMessage('Sincronização global de 60 dias executada com sucesso')
  @ApiOperation({
    summary:
      'Sincronizar todos os jogos dos próximos 60 dias (de 10 em 10 dias) e salvar no MongoDB por campeonato',
    description:
      'Busca jogos da API football-data.org dos próximos 60 dias, dividindo em períodos de 10 dias para respeitar os limites da API, e salva todos no MongoDB organizados por campeonato',
  })
  async sincronizarGlobal60Dias() {
    try {
      const hoje = new Date().toISOString().split('T')[0];

      this.logger.log('🌍 Iniciando sincronização global de 60 dias...');

      const resultado = await this.jogosService.sincronizarJogos60DiasComCampeonatos(hoje);

      this.logger.log(
        `✅ Sincronização global concluída: ${resultado.totalJogosSalvos} jogos salvos em ${resultado.totalCampeonatos} campeonatos`
      );

      return {
        sucesso: true,
        dataInicial: hoje,
        diasSincronizados: 60,
        totalJogosSalvos: resultado.totalJogosSalvos,
        totalCampeonatos: resultado.totalCampeonatos,
        jogosPorCampeonato: resultado.jogosPorCampeonato,
        periodosProcessados: resultado.periodosProcessados,
        estatisticas: resultado.estatisticas,
      };
    } catch (error) {
      this.logger.error('❌ Erro na sincronização global de 60 dias:', error);
      throw new BadRequestException(`Erro na sincronização global: ${error.message}`);
    }
  }

  @Get('debug/datas/:dataInicial/:dias')
  @Public()
  @ResponseMessage('Debug de processamento de datas')
  @ApiOperation({ summary: 'Debug - mostrar como as datas estão sendo processadas' })
  async debugDatas(@Param('dataInicial') dataInicial: string, @Param('dias') dias: string) {
    const diasNumber = parseInt(dias, 10);

    // Simular o processamento de datas como no findByDataComCampeonatos (CORRIGIDO)
    const startDate = new Date(dataInicial + 'T00:00:00');

    const endDate = new Date(dataInicial + 'T00:00:00');
    endDate.setDate(endDate.getDate() + diasNumber);
    endDate.setHours(23, 59, 59, 999);

    return {
      entrada: {
        dataInicial,
        dias: diasNumber,
      },
      processamento: {
        startDate: startDate.toISOString(),
        startDateLocal: startDate.toString(),
        endDate: endDate.toISOString(),
        endDateLocal: endDate.toString(),
      },
      timezone: {
        timezoneOffset: new Date().getTimezoneOffset(),
        locale: Intl.DateTimeFormat().resolvedOptions(),
      },
    };
  }
}
