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
import { PaginacaoJogosDto } from './dto/paginacao-jogos.dto';
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
  @ApiOperation({
    summary: 'Listar jogos de uma data específica organizados por campeonatos com paginação',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página atual (inicia em 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Jogos por campeonato por página',
    example: 10,
  })
  @ApiQuery({
    name: 'campeonato',
    required: false,
    description: 'Nome do campeonato específico para paginação',
  })
  async findJogosByData(@Param('data') data: string, @Query() paginacaoDto: PaginacaoJogosDto) {
    const { page, limit, campeonato } = paginacaoDto;

    // Se algum parâmetro de paginação foi fornecido, usa paginação
    if (page || limit || campeonato) {
      return this.jogosService.findByDataComCampeonatos(data, 60, undefined, {
        page: page || 1,
        limit: limit || 10,
        campeonato,
      });
    }

    // Caso contrário, retorna todos os jogos (comportamento original)
    return this.jogosService.findByDataComCampeonatos(data, 60);
  }

  @Get('data/:data/campeonatos')
  @Public()
  @ResponseMessage('Jogos da data organizados por campeonatos')
  @ApiOperation({ summary: 'Listar jogos de uma data específica organizados por campeonatos' })
  async findJogosByDataComCampeonatos(@Param('data') data: string) {
    return this.footballApiService.getJogosPorDataComCampeonatos(data, true);
  }

  @Get('paginados')
  @ApiOperation({
    summary: 'Buscar jogos paginados por campeonato (para scroll infinito)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 20, máx: 100)',
  })
  @ApiQuery({
    name: 'campeonato',
    required: false,
    type: String,
    description: 'Nome do campeonato específico',
  })
  @ApiQuery({
    name: 'dataInicial',
    required: false,
    type: String,
    description: 'Data inicial para busca (YYYY-MM-DD)',
  })
  async findJogosPaginados(@Query() paginacaoDto: PaginacaoJogosDto, @Request() req: any) {
    // Validações
    const page = Math.max(paginacaoDto.page || 1, 1);
    const limit = Math.min(Math.max(paginacaoDto.limit || 20, 1), 100);
    const dataInicial = paginacaoDto.dataInicial || new Date().toISOString().split('T')[0];

    this.logger.log(
      `🔍 Busca paginada - Página: ${page}, Limite: ${limit}, Campeonato: ${paginacaoDto.campeonato || 'Todos'}`
    );

    const userId = req.user?.id || req.user?.sub;

    const resultado = await this.jogosService.findByDataComCampeonatos(
      dataInicial,
      60, // 60 dias para ter mais jogos disponíveis
      userId,
      {
        page,
        limit,
        campeonato: paginacaoDto.campeonato,
      }
    );

    this.logger.log(
      `📊 Retornando página ${page} com ${resultado.campeonatos?.reduce((acc, c) => acc + (c.jogos?.length || 0), 0)} jogos`
    );

    return resultado;
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
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: limit do parâmetro, máx: 1000)',
    example: 10,
  })
  @ApiQuery({
    name: 'campeonato',
    required: false,
    type: String,
    description: 'Nome do campeonato específico para paginação',
    example: 'Brasileirão Série A',
  })
  async findJogosPorCampeonatos(
    @Param('dataInicial') dataInicial: string,
    @Param('limite') limite: string,
    @Query() paginacaoDto: PaginacaoJogosDto,
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

    // Prepara opções de paginação
    const paginacaoOptions = {
      page: paginacaoDto.page || 1,
      limit: Math.min(paginacaoDto.limit || limiteNumber, limiteNumber),
      campeonato: paginacaoDto.campeonato,
    };

    const resultadoCompleto = await this.jogosService.findByDataComCampeonatos(
      dataInicial,
      60, // Busca em 60 dias para ter mais jogos disponíveis
      userId,
      paginacaoOptions
    );

    // Se foi usado paginação específica por campeonato, retorna o resultado direto
    if (paginacaoDto.campeonato) {
      this.logger.log(`📊 Retornando jogos paginados do campeonato: ${paginacaoDto.campeonato}`);
      return resultadoCompleto;
    }

    // Para busca geral (sem campeonato específico), aplica o limite de quantidade de jogos
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
}
