import { Module } from '@nestjs/common';
import { CepController } from './cep.controller';
import { CepService } from './cep.service';

@Module({
  providers: [CepService],
  controllers: [CepController],
  exports: [CepService],
})
export class CepModule {}
