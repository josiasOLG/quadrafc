import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { SincronizacaoService } from './sincronizacao.service';

@ApiTags('sincronizacao')
@Controller('sincronizacao')
export class SincronizacaoController {
  constructor(private readonly sincronizacaoService: SincronizacaoService) {}

  @Post('manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Forçar sincronização manual de jogos para uma data' })
  @ApiResponse({ status: 200, description: 'Sincronização realizada com sucesso' })
  async sincronizarManual(@Body() body: { data: string }) {
    return this.sincronizacaoService.sincronizarManual(body.data);
  }

  @Post('verificar-jogos-finalizados')
  @ApiOperation({ summary: 'Forçar verificação de jogos finalizados e processar palpites' })
  @ApiResponse({ status: 200, description: 'Verificação realizada com sucesso' })
  async verificarJogosFinalizados() {
    await this.sincronizacaoService.verificarJogosFinalizados();
    return { message: 'Verificação de jogos finalizados realizada com sucesso.' };
  }

  @Post('verificar-jogos-finalizados-manual')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Forçar verificação manual de jogos finalizados de períodos passados' })
  @ApiResponse({ status: 200, description: 'Verificação manual realizada com sucesso' })
  async verificarJogosFinalizadosManual() {
    return await this.sincronizacaoService.verificarJogosFinalizadosManual();
  }

  @Post('verificar-jogos-ultimos-dias')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Forçar verificação de jogos dos últimos 7 dias' })
  @ApiResponse({ status: 200, description: 'Verificação realizada com sucesso' })
  async verificarJogosUltimosDias() {
    await this.sincronizacaoService.verificarJogosUltimosDias();
    return { message: 'Verificação de jogos dos últimos 7 dias realizada com sucesso.' };
  }
}
