import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { Public } from '../../shared/decorators/public.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@Request() req: any) {
    const userId = req.user._id;
    return await this.dashboardService.getDashboardStats(userId);
  }

  @Get('jogos-destaque')
  async getJogosDestaque() {
    return await this.dashboardService.getJogosDestaque();
  }

  @Get('palpites-recentes')
  async getPalpitesRecentes(@Request() req: any) {
    const userId = req.user._id;
    return await this.dashboardService.getPalpitesRecentes(userId);
  }

  @Get('atividade-bairro')
  async getAtividadeBairro(@Request() req: any) {
    const userId = req.user._id;
    return await this.dashboardService.getAtividadeBairro(userId);
  }

  @Get('missoes-ativas')
  async getMissoesAtivas(@Request() req: any) {
    const userId = req.user._id;
    return await this.dashboardService.getMissoesAtivas(userId);
  }

  @Get('conquistas')
  async getConquistas(@Request() req: any) {
    const userId = req.user._id;
    return await this.dashboardService.getConquistasDisponiveis(userId);
  }

  @Get('progresso-semanal')
  async getProgressoSemanal(@Request() req: any) {
    const userId = req.user._id;
    return await this.dashboardService.getProgressoSemanal(userId);
  }

  @Get('notificacoes')
  async getNotificacoes(@Request() req: any) {
    const userId = req.user._id;
    return await this.dashboardService.getNotificacoes(userId);
  }

  @Get('resumo-diario')
  async getResumoDiario(@Request() req: any) {
    const userId = req.user._id;
    return await this.dashboardService.getResumoDiario(userId);
  }
}
