import { Controller, Get, Query, Param, Inject, Post, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JogosService } from './jogos.service';
import { FootballApiService } from '../football-api/football-api.service';
import { Public } from '../../shared/decorators/public.decorator';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';

@ApiTags('jogos')
@Controller('jogos')
export class JogosController {
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
  @ResponseMessage('Jogos da data recuperados com sucesso')
  @ApiOperation({ summary: 'Listar jogos de uma data específica' })
  async findJogosByData(@Param('data') data: string) {
    return this.jogosService.findByData(data);
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

  @Get('api/test/:data')
  @Public()
  @ResponseMessage('Teste da API externa')
  @ApiOperation({ summary: 'Testar API externa diretamente' })
  async testApiExterna(@Param('data') data: string) {
    // Inject FootballApiService diretamente para teste
    const { FootballApiService } = await import('../football-api/football-api.service');
    const { ConfigService } = await import('@nestjs/config');
    
    const configService = new ConfigService();
    const footballApiService = new FootballApiService(configService);
    
    try {
      const result = await footballApiService.getJogosPorData(data);
      return {
        success: true,
        data: result,
        message: 'API chamada com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Erro ao chamar API'
      };
    }
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
        message: 'Esta data nunca foi sincronizada'
      };
    }
    return status;
  }

  @Get('range/:dataInicial/:dias')
  @Public()
  @ResponseMessage('Jogos do range de datas recuperados com sucesso')
  @ApiOperation({ summary: 'Buscar jogos em um range de datas (da data inicial até X dias no futuro)' })
  async findJogosByRange(@Param('dataInicial') dataInicial: string, @Param('dias') dias: string) {
    const diasNumber = parseInt(dias, 10);
    const dataFim = new Date(dataInicial);
    dataFim.setDate(dataFim.getDate() + diasNumber);
    
    const startDate = new Date(dataInicial + 'T00:00:00.000Z');
    const endDate = new Date(dataFim.toISOString().split('T')[0] + 'T23:59:59.999Z');
    
    return this.jogosService.findAll().then(jogos => 
      jogos.filter(jogo => 
        jogo.data >= startDate && jogo.data <= endDate
      )
    );
  }

  @Get('campeonatos/:dataInicial/:dias')
  @Public()
  @ResponseMessage('Jogos por campeonatos recuperados com sucesso')
  @ApiOperation({ summary: 'Buscar jogos organizados por campeonatos (Mundial FIFA, Brasileirão, Carioca, etc.)' })
  async findJogosPorCampeonatos(@Param('dataInicial') dataInicial: string, @Param('dias') dias: string) {
    const diasNumber = parseInt(dias, 10);
    
    // Valida o limite máximo de 30 dias
    if (diasNumber > 30) {
      throw new BadRequestException('O limite máximo é de 30 dias no futuro');
    }
    
    // Primeiro tenta buscar do MongoDB
    let resultado = await this.jogosService.findByDataComCampeonatos(dataInicial, diasNumber);
    
    // Se não encontrou jogos no MongoDB, sincroniza da API externa e busca novamente
    if (resultado.totalJogos === 0) {
      await this.jogosService.sincronizarJogosRangeDaAPI(dataInicial, diasNumber);
      resultado = await this.jogosService.findByDataComCampeonatos(dataInicial, diasNumber);
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

  // Endpoint de limpeza removido - limpeza será feita manualmente
}
