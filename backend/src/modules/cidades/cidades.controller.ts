import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CidadesService } from './cidades.service';
import { Public } from '../../shared/decorators/public.decorator';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Admin } from '../../shared/decorators/roles.decorator';

@ApiTags('cidades')
@Controller('cidades')
export class CidadesController {
  constructor(private readonly cidadesService: CidadesService) {}

  @Get()
  @Public()
  @ResponseMessage('Cidades recuperadas com sucesso')
  @ApiOperation({ summary: 'Listar cidades com paginação' })
  @ApiQuery({ name: 'uf', required: false, description: 'Filtrar por UF' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('uf') uf?: string
  ) {
    const { data, total } = await this.cidadesService.findAllPaginated(
      paginationDto, 
      uf
    );
    
    return ResponseUtil.paginated(
      data,
      paginationDto.page,
      paginationDto.limit,
      total,
      'Cidades recuperadas com sucesso'
    );
  }

  @Get('search')
  @Public()
  @ResponseMessage('Busca de cidades realizada com sucesso')
  @ApiOperation({ summary: 'Buscar cidades por nome' })
  @ApiQuery({ name: 'q', required: false, description: 'Termo de busca' })
  @ApiQuery({ name: 'uf', required: false, description: 'Filtrar por UF' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async search(
    @Query() paginationDto: PaginationDto,
    @Query('q') searchTerm: string = '',
    @Query('uf') uf?: string
  ) {
    const { data, total } = await this.cidadesService.search(searchTerm, paginationDto, uf);
    
    return ResponseUtil.paginated(
      data,
      paginationDto.page,
      paginationDto.limit,
      total,
      'Busca de cidades realizada com sucesso'
    );
  }

  @Get('uf/:uf')
  @Public()
  @ResponseMessage('Cidades do estado recuperadas com sucesso')
  @ApiOperation({ summary: 'Obter cidades de um estado específico' })
  async findByUf(@Query('uf') uf: string) {
    return this.cidadesService.findByUf(uf);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Admin()
  @ApiBearerAuth()
  @ResponseMessage('Cidade criada com sucesso')
  @ApiOperation({ summary: 'Criar nova cidade (apenas admin)' })
  async create(@Body() createCidadeDto: any) {
    return this.cidadesService.create(createCidadeDto);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Admin()
  @ApiBearerAuth()
  @ResponseMessage('Seed de cidades executado com sucesso')
  @ApiOperation({ summary: 'Executar seed das cidades (apenas admin)' })
  async seed() {
    await this.cidadesService.seedCidades();
    return { message: 'Seed de cidades executado com sucesso' };
  }
}
