import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConquistasService } from './conquistas.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

@ApiTags('conquistas')
@Controller('conquistas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConquistasController {
  constructor(private readonly conquistasService: ConquistasService) {}

  @Get('minhas')
  @ResponseMessage('Minhas conquistas recuperadas com sucesso')
  @ApiOperation({ summary: 'Obter conquistas completadas do usuário' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async getMinhasConquistas(
    @Query() paginationDto: PaginationDto,
    @Request() req
  ) {
    const { data, total } = await this.conquistasService.getMinhasConquistas(
      req.user.sub,
      paginationDto
    );
    
    return ResponseUtil.paginated(
      data,
      paginationDto.page,
      paginationDto.limit,
      total,
      'Minhas conquistas recuperadas com sucesso'
    );
  }

  @Get('disponiveis')
  @ResponseMessage('Conquistas disponíveis recuperadas com sucesso')
  @ApiOperation({ summary: 'Obter conquistas disponíveis para o usuário' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async getConquistasDisponiveis(
    @Query() paginationDto: PaginationDto,
    @Request() req
  ) {
    const { data, total } = await this.conquistasService.getConquistasDisponiveis(
      req.user.sub,
      paginationDto
    );
    
    return ResponseUtil.paginated(
      data,
      paginationDto.page,
      paginationDto.limit,
      total,
      'Conquistas disponíveis recuperadas com sucesso'
    );
  }

  @Get('progresso')
  @ResponseMessage('Progresso de conquistas recuperado com sucesso')
  @ApiOperation({ summary: 'Obter progresso das conquistas do usuário' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async getProgressoConquistas(
    @Query() paginationDto: PaginationDto,
    @Request() req
  ) {
    const { data, total } = await this.conquistasService.getProgressoConquistas(
      req.user.sub,
      paginationDto
    );
    
    return ResponseUtil.paginated(
      data,
      paginationDto.page,
      paginationDto.limit,
      total,
      'Progresso de conquistas recuperado com sucesso'
    );
  }

  @Get('estatisticas')
  @ResponseMessage('Estatísticas de conquistas recuperadas com sucesso')
  @ApiOperation({ summary: 'Obter estatísticas das conquistas do usuário' })
  async getEstatisticasConquistas(@Request() req) {
    return this.conquistasService.getEstatisticasConquistas(req.user.sub);
  }

  @Post('reivindicar/:conquistaId')
  @ResponseMessage('Conquista reivindicada com sucesso')
  @ApiOperation({ summary: 'Reivindicar recompensas de uma conquista' })
  async reivindicarConquista(
    @Param('conquistaId') conquistaId: string,
    @Request() req
  ) {
    return this.conquistasService.reivindicarConquista(req.user.sub, conquistaId);
  }
}
