import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PalpitesService } from './palpites.service';
import { CreatePalpiteDto } from '../../shared/dto/create-palpite.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';

@ApiTags('palpites')
@Controller('palpites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PalpitesController {
  constructor(private readonly palpitesService: PalpitesService) {}

  @Post()
  @ResponseMessage('Palpite criado com sucesso')
  @ApiOperation({ summary: 'Criar um novo palpite' })
  async create(@Body() createPalpiteDto: CreatePalpiteDto, @Request() req) {
    return this.palpitesService.create(req.user._id, createPalpiteDto);
  }

  @Get('meus')
  @ResponseMessage('Palpites recuperados com sucesso')
  @ApiOperation({ summary: 'Obter meus palpites' })
  async findMeusPalpites(@Request() req) {
    return this.palpitesService.findByUser(req.user._id);
  }

  @Get('jogo/:jogoId')
  @ResponseMessage('Palpite do jogo recuperado com sucesso')
  @ApiOperation({ summary: 'Obter meu palpite para um jogo específico' })
  async findPalpiteJogo(@Param('jogoId') jogoId: string, @Request() req) {
    return this.palpitesService.findByUserAndJogo(req.user._id, jogoId);
  }
}
