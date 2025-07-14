import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ResponseUtil } from '../../shared/utils/response.util';
import { UpdateLimitePalpitesDto } from './dto/update-limite-palpites.dto';
import { UpdateProfileVisibilityDto } from './dto/update-profile-visibility.dto';
import { UserSearchDto } from './dto/user-search.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Perfil do usuário recuperado com sucesso')
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Get('ranking')
  @ResponseMessage('Ranking de usuários recuperado com sucesso')
  @ApiOperation({ summary: 'Obter ranking individual dos usuários com paginação' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async getRanking(@Query() paginationDto: PaginationDto) {
    const normalizedPagination = {
      page: paginationDto.page || 1,
      limit: paginationDto.limit || 10,
      skip: paginationDto.skip,
    };

    const { data, total } = await this.usersService.getRankingIndividual(normalizedPagination);

    return ResponseUtil.paginated(
      data,
      normalizedPagination.page,
      normalizedPagination.limit,
      total,
      'Ranking de usuários recuperado com sucesso'
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ResponseMessage('Lista de usuários recuperada com sucesso')
  @ApiOperation({ summary: 'Listar todos os usuários (apenas admin)' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por nome ou email' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'assinaturaPremium', required: false, description: 'Filtrar por premium' })
  @ApiQuery({ name: 'banned', required: false, description: 'Filtrar por banidos' })
  async findAll(@Query() query: any) {
    const normalizedPagination = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
    };

    const filters = {
      search: query.search,
      ativo: query.ativo !== undefined ? query.ativo === 'true' : undefined,
      assinaturaPremium:
        query.assinaturaPremium !== undefined ? query.assinaturaPremium === 'true' : undefined,
      banned: query.banned !== undefined ? query.banned === 'true' : undefined,
    };

    const { data, total } = await this.usersService.findAll(normalizedPagination, filters);

    return ResponseUtil.paginated(
      data,
      normalizedPagination.page,
      normalizedPagination.limit,
      total,
      'Lista de usuários recuperada com sucesso'
    );
  }

  @Post('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ResponseMessage('Busca de usuários realizada com sucesso')
  @ApiOperation({ summary: 'Buscar usuários com filtros avançados (apenas admin)' })
  async searchUsers(@Body() searchDto: UserSearchDto) {
    const normalizedPagination = {
      page: searchDto.page || 1,
      limit: searchDto.limit || 10,
    };

    const filters = {
      search: searchDto.search,
      nome: searchDto.nome,
      email: searchDto.email,
      bairro: searchDto.bairro,
      cidade: searchDto.cidade,
      ativo: searchDto.ativo,
      assinaturaPremium: searchDto.assinaturaPremium,
      banned: searchDto.banned,
      isAdmin: searchDto.isAdmin,
    };

    const { data, total } = await this.usersService.searchUsers(normalizedPagination, filters);

    return ResponseUtil.paginated(
      data,
      normalizedPagination.page,
      normalizedPagination.limit,
      total,
      'Busca de usuários realizada com sucesso'
    );
  }

  @Post(':id/limite-palpites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ResponseMessage('Limite de palpites atualizado com sucesso')
  @ApiOperation({ summary: 'Atualizar limite diário de palpites de um usuário (apenas admin)' })
  async atualizarLimitePalpites(
    @Param('id') userId: string,
    @Body() updateDto: UpdateLimitePalpitesDto
  ) {
    return this.usersService.atualizarLimitePalpites(userId, updateDto.novoLimite);
  }

  @Post('migrar-limite-palpites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ResponseMessage('Migração de limite de palpites executada com sucesso')
  @ApiOperation({
    summary: 'Migrar usuários existentes com campos de limite de palpites (apenas admin)',
  })
  async migrarLimitePalpites() {
    return this.usersService.migrarUsuariosComLimitePalpites();
  }

  @Patch('profile-visibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Visibilidade do perfil atualizada com sucesso')
  @ApiOperation({ summary: 'Alterar visibilidade do perfil (público/privado)' })
  async updateProfileVisibility(@Request() req, @Body() updateDto: UpdateProfileVisibilityDto) {
    return this.usersService.updateProfileVisibility(req.user.id, updateDto.isPublicProfile);
  }
}
