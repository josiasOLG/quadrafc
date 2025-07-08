import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import { RankingService } from './ranking.service';

@ApiTags('ranking')
@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('verificar-premium')
  @Public()
  @ResponseMessage('Status do acesso premium verificado')
  @ApiOperation({ summary: 'Verificar se usuário tem acesso ao ranking premium' })
  async verificarAcessoPremium(@Request() req: any) {
    return this.rankingService.verificarAcessoPremium(req.user.userId);
  }

  @Post('desbloquear-nacional')
  @Public()
  @ResponseMessage('Ranking nacional desbloqueado')
  @ApiOperation({ summary: 'Desbloquear acesso ao ranking nacional' })
  async desbloquearRankingNacional(@Request() req: any) {
    return this.rankingService.desbloquearRankingNacional(req.user.userId);
  }

  @Get('acessos-disponiveis')
  @Public()
  @ResponseMessage('Acessos disponíveis recuperados')
  @ApiOperation({ summary: 'Listar acessos premium disponíveis para o usuário' })
  async listarAcessosDisponiveis(@Request() req: any) {
    return this.rankingService.listarAcessosDisponiveis(req.user.userId);
  }

  @Get('filtros-disponiveis')
  @Public()
  @ResponseMessage('Filtros disponíveis recuperados')
  @ApiOperation({ summary: 'Listar filtros de ranking disponíveis para o usuário' })
  async listarFiltrosDisponiveis(@Request() req: any) {
    return this.rankingService.listarFiltrosDisponiveis(req.user.userId);
  }

  @Get('verificar-acesso')
  @Public()
  @ResponseMessage('Acesso verificado')
  @ApiOperation({ summary: 'Verificar acesso específico do usuário' })
  @ApiQuery({ name: 'tipo', enum: ['estado', 'nacional'], description: 'Tipo de acesso' })
  @ApiQuery({ name: 'estado', required: false, description: 'Estado (para acesso estadual)' })
  async verificarAcessoEspecifico(
    @Request() req: any,
    @Query('tipo') tipo: 'estado' | 'nacional',
    @Query('estado') estado?: string
  ) {
    return this.rankingService.verificarAcessoEspecifico(req.user.userId, tipo, estado);
  }

  @Post('comprar-acesso-estado')
  @Public()
  @ResponseMessage('Acesso ao estado comprado')
  @ApiOperation({ summary: 'Comprar acesso ao ranking de um estado' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', description: 'Sigla do estado (ex: SP, RJ)' },
      },
      required: ['estado'],
    },
  })
  async comprarAcessoEstado(@Request() req: any, @Body() body: { estado: string }) {
    return this.rankingService.comprarAcessoEstado(req.user.userId, body.estado);
  }

  @Post('comprar-acesso-nacional')
  @Public()
  @ResponseMessage('Acesso nacional comprado')
  @ApiOperation({ summary: 'Comprar acesso ao ranking nacional' })
  async comprarAcessoNacional(@Request() req: any) {
    return this.rankingService.comprarAcessoNacional(req.user.userId);
  }

  @Post('comprar-acesso-cidade')
  @Public()
  @ResponseMessage('Acesso à cidade comprado')
  @ApiOperation({ summary: 'Comprar acesso ao ranking de uma cidade específica' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cidade: { type: 'string', description: 'Nome da cidade' },
        estado: { type: 'string', description: 'Sigla do estado (ex: SP, RJ)' },
      },
      required: ['cidade', 'estado'],
    },
  })
  async comprarAcessoCidade(@Request() req: any, @Body() body: { cidade: string; estado: string }) {
    return this.rankingService.comprarAcessoCidade(req.user.userId, body.cidade, body.estado);
  }

  @Post('comprar-assinatura-premium')
  @Public()
  @ResponseMessage('Assinatura premium contratada')
  @ApiOperation({ summary: 'Comprar assinatura premium vitalícia (500 moedas/mês)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        meses: { type: 'number', description: 'Quantidade de meses (padrão: 1)', minimum: 1 },
      },
    },
  })
  async comprarAssinaturaPremium(@Request() req: any, @Body() body: { meses?: number }) {
    return this.rankingService.comprarAssinaturaPremium(req.user.userId, body.meses || 1);
  }

  @Get('usuarios-cidade')
  @Public()
  @ResponseMessage('Ranking de usuários da cidade recuperado')
  @ApiOperation({ summary: 'Buscar ranking de usuários de uma cidade específica' })
  @ApiQuery({ name: 'cidade', required: true, description: 'Nome da cidade' })
  @ApiQuery({ name: 'estado', required: true, description: 'Sigla do estado (ex: SP, RJ)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (padrão: 50)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginação (padrão: 0)' })
  async getRankingUsuariosCidade(
    @Query('cidade') cidade: string,
    @Query('estado') estado: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    console.log('🎯 Controller getRankingUsuariosCidade:', {
      cidade,
      estado,
      limit,
      offset,
    });

    if (!cidade || !estado) {
      throw new Error('Cidade e estado são obrigatórios');
    }

    return this.rankingService.getRankingUsuariosCidade(cidade, estado, {
      limit: limit || 50,
      offset: offset || 0,
    });
  }

  @Get('bairros-cidade')
  @Public()
  @ResponseMessage('Ranking de bairros da cidade recuperado')
  @ApiOperation({ summary: 'Buscar ranking de bairros de uma cidade específica' })
  @ApiQuery({ name: 'cidade', required: true, description: 'Nome da cidade' })
  @ApiQuery({ name: 'estado', required: true, description: 'Sigla do estado (ex: SP, RJ)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (padrão: 50)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginação (padrão: 0)' })
  async getRankingBairrosCidade(
    @Query('cidade') cidade: string,
    @Query('estado') estado: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    console.log('🎯 Controller getRankingBairrosCidade:', {
      cidade,
      estado,
      limit,
      offset,
    });

    if (!cidade || !estado) {
      throw new Error('Cidade e estado são obrigatórios');
    }

    return this.rankingService.getRankingBairrosCidade(cidade, estado, {
      limit: limit || 50,
      offset: offset || 0,
    });
  }
}
