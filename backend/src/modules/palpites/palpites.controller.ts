import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';
import { CreatePalpiteDto } from '../../shared/dto/create-palpite.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PalpitesService } from './palpites.service';

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

  @Get('status')
  @ResponseMessage('Status de palpites recuperado com sucesso')
  @ApiOperation({ summary: 'Obter status de palpites do usuário (limite diário, restantes, etc.)' })
  async getStatusPalpites(@Request() req) {
    return this.palpitesService.obterStatusPalpitesUsuario(req.user._id);
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
