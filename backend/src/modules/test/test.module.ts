import { Module } from '@nestjs/common';
import { PremiumAccessModule } from '../../shared/modules/premium-access.module';
import { TestController } from './test.controller';

@Module({
  imports: [PremiumAccessModule],
  controllers: [TestController],
})
export class TestModule {}
