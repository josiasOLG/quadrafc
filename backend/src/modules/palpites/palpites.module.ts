import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Palpite, PalpiteSchema } from '../../shared/schemas/palpite.schema';
import { PalpitesService } from './palpites.service';
import { PalpitesController } from './palpites.controller';
import { JogosModule } from '../jogos/jogos.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Palpite.name, schema: PalpiteSchema }]),
    JogosModule,
  ],
  controllers: [PalpitesController],
  providers: [PalpitesService],
  exports: [PalpitesService],
})
export class PalpitesModule {}
