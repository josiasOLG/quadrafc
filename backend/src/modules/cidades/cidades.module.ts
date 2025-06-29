import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CidadesController } from './cidades.controller';
import { CidadesService } from './cidades.service';
import { Cidade, CidadeSchema } from '../../shared/schemas/cidade.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cidade.name, schema: CidadeSchema }
    ])
  ],
  controllers: [CidadesController],
  providers: [CidadesService],
  exports: [CidadesService]
})
export class CidadesModule {}
