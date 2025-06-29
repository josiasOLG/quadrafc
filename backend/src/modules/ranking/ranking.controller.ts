import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RankingService } from './ranking.service';

@ApiTags('ranking')
@Controller('ranking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('verificar-premium')
  @ResponseMessage('Status do acesso premium verificado')
  @ApiOperation({ summary: 'Verificar se usuário tem acesso ao ranking premium' })
  async verificarAcessoPremium(@Request() req: any) {
    return this.rankingService.verificarAcessoPremium(req.user.userId);
  }

  @Post('desbloquear-nacional')
  @ResponseMessage('Ranking nacional desbloqueado')
  @ApiOperation({ summary: 'Desbloquear acesso ao ranking nacional' })
  async desbloquearRankingNacional(@Request() req: any) {
    return this.rankingService.desbloquearRankingNacional(req.user.userId);
  }

  @Get('acessos-disponiveis')
  @ResponseMessage('Acessos disponíveis recuperados')
  @ApiOperation({ summary: 'Listar acessos premium disponíveis para o usuário' })
  async listarAcessosDisponiveis(@Request() req: any) {
    return this.rankingService.listarAcessosDisponiveis(req.user.userId);
  }

  @Get('filtros-disponiveis')
  @ResponseMessage('Filtros disponíveis recuperados')
  @ApiOperation({ summary: 'Listar filtros de ranking disponíveis para o usuário' })
  async listarFiltrosDisponiveis(@Request() req: any) {
    return this.rankingService.listarFiltrosDisponiveis(req.user.userId);
  }

  @Get('verificar-acesso')
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
  @ResponseMessage('Acesso nacional comprado')
  @ApiOperation({ summary: 'Comprar acesso ao ranking nacional' })
  async comprarAcessoNacional(@Request() req: any) {
    return this.rankingService.comprarAcessoNacional(req.user.userId);
  }

  @Post('comprar-acesso-cidade')
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
}
