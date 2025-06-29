import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rodada, RodadaSchema } from '../../shared/schemas/rodada.schema';
import { RodadasService } from './rodadas.service';
import { RodadasController } from './rodadas.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rodada.name, schema: RodadaSchema }]),
  ],
  controllers: [RodadasController],
  providers: [RodadasService],
  exports: [RodadasService],
})
export class RodadasModule {}
