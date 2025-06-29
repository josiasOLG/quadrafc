import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FootballApiService } from './football-api.service';

@Module({
  imports: [ConfigModule],
  providers: [FootballApiService],
  exports: [FootballApiService],
})
export class FootballApiModule {}
