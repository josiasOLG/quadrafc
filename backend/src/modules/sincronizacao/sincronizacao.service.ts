import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JogosService } from '../jogos/jogos.service';

@Injectable()
export class SincronizacaoService {
  private readonly logger = new Logger(SincronizacaoService.name);

  constructor(private readonly jogosService: JogosService) {}

  // Executa a cada 6 horas para manter os dados atualizados
  @Cron('0 */6 * * *', {
    name: 'sincronizacao-jogos-periodica',
    timeZone: 'America/Sao_Paulo',
  })
  async sincronizacaoPeriodicaJogos() {
    this.logger.log('Iniciando sincronização periódica de jogos...');
    
    try {
      const hoje = new Date();
      const proximosDias = [];
      
      // Sincroniza apenas os próximos 30 dias (conforme especificado)
      for (let i = 0; i <= 30; i++) {
        const data = new Date(hoje);
        data.setDate(data.getDate() + i);
        const dataStr = data.toISOString().split('T')[0];
        proximosDias.push(dataStr);
      }
      
      let totalSincronizados = 0;
      
      for (const data of proximosDias) {
        try {
          const resultado = await this.jogosService.forcarSincronizacao(data);
          totalSincronizados += resultado.totalJogos;
          this.logger.log(`Sincronização para ${data}: ${resultado.totalJogos} jogos reais`);
        } catch (error) {
          this.logger.error(`Erro na sincronização para ${data}:`, error.message);
        }
      }
      
      this.logger.log(`Sincronização periódica concluída. Total: ${totalSincronizados} jogos reais processados`);
    } catch (error) {
      this.logger.error('Erro na sincronização periódica:', error.message);
    }
  }

  // Executa uma vez por dia às 6h da manhã para sincronizar o dia atual
  @Cron('0 6 * * *', {
    name: 'sincronizacao-jogos-diaria',
    timeZone: 'America/Sao_Paulo',
  })
  async sincronizacaoDiariaJogos() {
    this.logger.log('Iniciando sincronização diária de jogos...');
    
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const resultado = await this.jogosService.forcarSincronizacao(hoje);
      
      this.logger.log(`Sincronização diária concluída para ${hoje}: ${resultado.totalJogos} jogos`);
    } catch (error) {
      this.logger.error('Erro na sincronização diária:', error.message);
    }
  }

  // Método para sincronização manual via API
  async sincronizarManual(data: string): Promise<any> {
    this.logger.log(`Iniciando sincronização manual para ${data}...`);
    
    try {
      const resultado = await this.jogosService.forcarSincronizacao(data);
      this.logger.log(`Sincronização manual concluída para ${data}: ${resultado.totalJogos} jogos`);
      return resultado;
    } catch (error) {
      this.logger.error(`Erro na sincronização manual para ${data}:`, error.message);
      throw error;
    }
  }
}
