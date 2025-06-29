import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  RequireCityAccess,
  RequireNationalAccess,
  RequireStateAccess,
} from '../../shared/decorators/premium-access.decorator';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PremiumAccessGuard } from '../../shared/guards/premium-access.guard';
import { BairrosService } from './bairros.service';

@ApiTags('bairros-premium')
@Controller('bairros-premium')
@UseGuards(JwtAuthGuard, PremiumAccessGuard)
@ApiBearerAuth()
export class BairrosPremiumController {
  constructor(private readonly bairrosService: BairrosService) {}

  @Get('ranking/cidade')
  @RequireCityAccess(true, true) // Permite cidade própria, permite premium subscription
  @ApiOperation({ summary: 'Ranking de bairros por cidade (própria cidade é gratuita)' })
  @ApiQuery({ name: 'cidade', required: false, description: 'Nome da cidade' })
  @ApiQuery({ name: 'estado', required: false, description: 'Sigla do estado' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items por página (padrão: 10)',
  })
  async getRankingPorCidade(
    @Request() req: any,
    @Query('cidade') cidade?: string,
    @Query('estado') estado?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const paginationDto = new PaginationDto();
    paginationDto.page = page;
    paginationDto.limit = limit;

    if (!cidade || !estado) {
      // Se não especificou cidade/estado, usar cidade do usuário
      return this.bairrosService.getRankingBairrosPorCidade(req.user.userId, paginationDto);
    }

    // Para outras cidades, o guard já verificou se tem acesso
    return this.bairrosService.findAllPaginated(paginationDto, cidade, estado);
  }

  @Get('ranking/estado')
  @RequireStateAccess(true) // Permite premium subscription
  @ApiOperation({ summary: 'Ranking de bairros por estado (requer acesso premium)' })
  @ApiQuery({ name: 'estado', required: true, description: 'Sigla do estado' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items por página (padrão: 10)',
  })
  async getRankingPorEstado(
    @Request() req: any,
    @Query('estado') estado: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const paginationDto = new PaginationDto();
    paginationDto.page = page;
    paginationDto.limit = limit;

    return this.bairrosService.getRankingPorEstado(req.user.userId, estado, paginationDto);
  }

  @Get('ranking/nacional')
  @RequireNationalAccess(true) // Permite premium subscription
  @ApiOperation({ summary: 'Ranking nacional de bairros (requer acesso premium)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items por página (padrão: 10)',
  })
  async getRankingNacional(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const paginationDto = new PaginationDto();
    paginationDto.page = page;
    paginationDto.limit = limit;

    return this.bairrosService.getRankingNacional(req.user.userId, paginationDto);
  }
}
