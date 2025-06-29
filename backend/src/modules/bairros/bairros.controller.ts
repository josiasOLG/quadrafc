import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import { Admin } from '../../shared/decorators/roles.decorator';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ResponseUtil } from '../../shared/utils/response.util';
import { BairrosService } from './bairros.service';

@ApiTags('bairros')
@Controller('bairros')
export class BairrosController {
  constructor(private readonly bairrosService: BairrosService) {}

  @Get()
  @Public()
  @ResponseMessage('Bairros recuperados com sucesso')
  @ApiOperation({ summary: 'Listar bairros com paginação' })
  @ApiQuery({ name: 'cidade', required: false, description: 'Filtrar por cidade' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('cidade') cidade?: string,
    @Query('estado') estado?: string
  ) {
    const { data, total } = await this.bairrosService.findAllPaginated(
      paginationDto,
      cidade,
      estado
    );

    return ResponseUtil.paginated(
      data,
      paginationDto.page,
      paginationDto.limit,
      total,
      'Bairros recuperados com sucesso'
    );
  }

  @Get('search')
  @Public()
  @ResponseMessage('Busca de bairros realizada com sucesso')
  @ApiOperation({ summary: 'Buscar bairros por nome' })
  @ApiQuery({ name: 'q', required: false, description: 'Termo de busca' })
  @ApiQuery({ name: 'cidade', required: false, description: 'Filtrar por cidade' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async search(
    @Query() paginationDto: PaginationDto,
    @Query('q') searchTerm: string = '',
    @Query('cidade') cidade?: string
  ) {
    const { data, total } = await this.bairrosService.search(searchTerm, paginationDto, cidade);

    return ResponseUtil.paginated(
      data,
      paginationDto.page,
      paginationDto.limit,
      total,
      'Busca de bairros realizada com sucesso'
    );
  }

  @Get('ranking')
  @Public()
  @ResponseMessage('Ranking de bairros recuperado com sucesso')
  @ApiOperation({ summary: 'Obter ranking de bairros com paginação' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async getRanking(@Query() paginationDto: PaginationDto) {
    const { data, total } = await this.bairrosService.getRankingBairros(paginationDto);

    return ResponseUtil.paginated(
      data,
      paginationDto.page,
      paginationDto.limit,
      total,
      'Ranking de bairros recuperado com sucesso'
    );
  }

  @Get('ranking/minha-cidade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Ranking de bairros da sua cidade recuperado com sucesso')
  @ApiOperation({ summary: 'Obter ranking de bairros da mesma cidade do usuário' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async getRankingMinhaCidade(@Query() paginationDto: PaginationDto, @Request() req: any) {
    const { data, total } = await this.bairrosService.getRankingBairrosPorCidade(
      req.user.userId,
      paginationDto
    );

    return ResponseUtil.paginated(
      data,
      paginationDto.page,
      paginationDto.limit,
      total,
      'Ranking de bairros da sua cidade recuperado com sucesso'
    );
  }

  @Get('ranking/nacional')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Ranking nacional de bairros recuperado com sucesso')
  @ApiOperation({ summary: 'Obter ranking nacional de bairros (premium)' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async getRankingNacional(@Query() paginationDto: PaginationDto, @Request() req: any) {
    const { data, total } = await this.bairrosService.getRankingNacional(
      req.user.userId,
      paginationDto
    );

    return ResponseUtil.paginated(
      data,
      paginationDto.page,
      paginationDto.limit,
      total,
      'Ranking nacional de bairros recuperado com sucesso'
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Admin()
  @ApiBearerAuth()
  @ResponseMessage('Bairro criado com sucesso')
  @ApiOperation({ summary: 'Criar novo bairro (apenas admin)' })
  async create(@Body() createBairroDto: any) {
    return this.bairrosService.create(createBairroDto);
  }
}
