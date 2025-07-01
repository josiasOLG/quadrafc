import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PremiumAccessModule } from '../../shared/modules/premium-access.module';
import { Bairro, BairroSchema } from '../../shared/schemas/bairro.schema';
import { User, UserSchema } from '../../shared/schemas/user.schema';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bairro.name, schema: BairroSchema },
    ]),
    PremiumAccessModule,
  ],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}
