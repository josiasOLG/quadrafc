import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SincronizacaoService } from './sincronizacao.service';
import { JogosModule } from '../jogos/jogos.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JogosModule,
  ],
  providers: [SincronizacaoService],
  exports: [SincronizacaoService],
})
export class SincronizacaoModule {}
