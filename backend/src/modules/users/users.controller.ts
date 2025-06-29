import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

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
    return req.user;
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
      skip: paginationDto.skip
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
}
