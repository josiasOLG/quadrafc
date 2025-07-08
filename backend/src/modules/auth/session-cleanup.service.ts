import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from '../auth/session.service';

@Injectable()
export class SessionCleanupService {
  constructor(private sessionService: SessionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleSessionCleanup() {
    console.log('Executando limpeza de sessões expiradas...');
    await this.sessionService.cleanExpiredSessions();
    console.log('Limpeza de sessões concluída');
  }
}
