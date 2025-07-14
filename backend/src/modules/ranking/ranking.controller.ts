import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import { RankingService } from './ranking.service';

@ApiTags('ranking')
@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('usuarios-cidade')
  @Public()
  @ResponseMessage('Ranking de usuários da cidade recuperado')
  @ApiOperation({ summary: 'Buscar ranking de usuários de uma cidade específica' })
  @ApiQuery({ name: 'cidade', required: true, description: 'Nome da cidade' })
  @ApiQuery({ name: 'estado', required: true, description: 'Sigla do estado (ex: SP, RJ)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (padrão: 50)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginação (padrão: 0)' })
  @ApiQuery({ name: 'campeonato', required: false, description: 'Nome do campeonato para filtrar' })
  async getRankingUsuariosCidade(
    @Query('cidade') cidade: string,
    @Query('estado') estado: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('campeonato') campeonato?: string
  ) {
    if (!cidade || !estado) {
      throw new BadRequestException('Cidade e estado são obrigatórios');
    }

    return this.rankingService.getRankingUsuariosCidade(
      cidade,
      estado,
      {
        limit: limit || 50,
        offset: offset || 0,
      },
      campeonato
    );
  }

  @Get('bairros-cidade')
  @Public()
  @ResponseMessage('Ranking de bairros da cidade recuperado')
  @ApiOperation({ summary: 'Buscar ranking de bairros de uma cidade específica' })
  @ApiQuery({ name: 'cidade', required: true, description: 'Nome da cidade' })
  @ApiQuery({ name: 'estado', required: true, description: 'Sigla do estado (ex: SP, RJ)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (padrão: 50)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginação (padrão: 0)' })
  @ApiQuery({ name: 'campeonato', required: false, description: 'Nome do campeonato para filtrar' })
  async getRankingBairrosCidade(
    @Query('cidade') cidade: string,
    @Query('estado') estado: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('campeonato') campeonato?: string
  ) {
    if (!cidade || !estado) {
      throw new BadRequestException('Cidade e estado são obrigatórios');
    }

    return this.rankingService.getRankingBairrosCidade(
      cidade,
      estado,
      {
        limit: limit || 50,
        offset: offset || 0,
      },
      campeonato
    );
  }

  @Get('top-usuarios-por-bairro')
  @Public()
  @ResponseMessage('Top usuários por bairro recuperados')
  @ApiOperation({ summary: 'Buscar os 5 melhores usuários de cada bairro em uma cidade' })
  @ApiQuery({ name: 'cidade', required: true, description: 'Nome da cidade' })
  @ApiQuery({ name: 'estado', required: true, description: 'Sigla do estado (ex: SP, RJ)' })
  @ApiQuery({ name: 'campeonato', required: false, description: 'Nome do campeonato para filtrar' })
  async getTopUsuariosPorBairro(
    @Query('cidade') cidade: string,
    @Query('estado') estado: string,
    @Query('campeonato') campeonato?: string
  ) {
    if (!cidade || !estado) {
      throw new BadRequestException('Cidade e estado são obrigatórios');
    }

    return this.rankingService.getRankingTopUsuariosPorBairro(cidade, estado, campeonato);
  }

  @Get('filtros-disponiveis')
  @Public()
  @ResponseMessage('Filtros disponíveis recuperados')
  @ApiOperation({ summary: 'Listar filtros de ranking disponíveis' })
  async listarFiltrosDisponiveis() {
    // Retornar filtros básicos públicos, como faz o módulo de jogos
    return {
      filtros: [
        { label: 'Meu Bairro', value: 'bairro', disponivel: true, gratuito: true },
        { label: 'Minha Cidade', value: 'cidade', disponivel: true, gratuito: true },
        { label: 'Meu Estado', value: 'estado', disponivel: false, gratuito: false, custo: 100 },
        { label: 'Nacional', value: 'nacional', disponivel: false, gratuito: false, custo: 500 },
      ],
      acessos: {
        assinaturaPremium: false,
        dataVencimentoPremium: null,
        estadosAcessiveis: [],
        cidadesAcessiveis: [],
        temAcessoNacional: false,
      },
      custos: {
        cidade: 50,
        estado: 100,
        nacional: 500,
        assinaturaPremiumMensal: 500,
      },
    };
  }

  @Get('campeonatos')
  @Public()
  @ResponseMessage('Campeonatos do mês atual recuperados')
  @ApiOperation({ summary: 'Buscar campeonatos do mês atual' })
  async getCampeonatosMesAtual() {
    return this.rankingService.getCampeonatosMesAtual();
  }
}
