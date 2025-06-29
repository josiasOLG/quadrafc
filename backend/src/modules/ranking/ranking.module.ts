import { Module } from '@nestjs/common';
import { PremiumAccessModule } from '../../shared/modules/premium-access.module';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';

@Module({
  imports: [PremiumAccessModule],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}
