import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransacoesMoedasService } from './transacoes-moedas.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ResponseMessage } from '../../shared/decorators/response-message.decorator';

@ApiTags('transacoes-moedas')
@Controller('transacoes-moedas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransacoesMoedasController {
  constructor(private readonly transacoesMoedasService: TransacoesMoedasService) {}

  @Get('extrato')
  @ResponseMessage('Extrato de transações recuperado com sucesso')
  @ApiOperation({ summary: 'Obter extrato de transações de moedas' })
  async getExtrato(@Request() req) {
    return this.transacoesMoedasService.findByUser(req.user._id);
  }

  @Get('extrato/mensal')
  @ResponseMessage('Extrato mensal recuperado com sucesso')
  @ApiOperation({ summary: 'Obter extrato mensal de transações' })
  @ApiQuery({ name: 'ano', required: true, example: 2025 })
  @ApiQuery({ name: 'mes', required: true, example: 6 })
  async getExtratoMensal(
    @Query('ano') ano: number,
    @Query('mes') mes: number,
    @Request() req
  ) {
    return this.transacoesMoedasService.obterExtratoMensal(req.user._id, ano, mes);
  }
}
