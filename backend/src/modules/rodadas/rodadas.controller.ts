import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RodadasService } from './rodadas.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Public } from '../../shared/decorators/public.decorator';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';

@ApiTags('rodadas')
@Controller('rodadas')
export class RodadasController {
  constructor(private readonly rodadasService: RodadasService) {}

  @Get()
  @Public()
  @ResponseMessage('Rodadas recuperadas com sucesso')
  @ApiOperation({ summary: 'Listar todas as rodadas' })
  async findAll() {
    return this.rodadasService.findAll();
  }

  @Get('ativa')
  @Public()
  @ResponseMessage('Rodada ativa recuperada com sucesso')
  @ApiOperation({ summary: 'Obter a rodada ativa atual' })
  async findAtiva() {
    return this.rodadasService.findAtiva();
  }

  @Post(':id/ativar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Rodada ativada com sucesso')
  @ApiOperation({ summary: 'Ativar uma rodada (apenas admin)' })
  async ativar(@Param('id') id: string) {
    return this.rodadasService.ativar(id);
  }
}
