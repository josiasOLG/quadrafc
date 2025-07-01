import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bairro, BairroSchema } from '../../shared/schemas/bairro.schema';
import { CepController } from './cep.controller';
import { CepService } from './cep.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Bairro.name, schema: BairroSchema }])],
  providers: [CepService],
  controllers: [CepController],
  exports: [CepService],
})
export class CepModule {}
