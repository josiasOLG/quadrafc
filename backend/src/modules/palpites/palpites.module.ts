import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Palpite, PalpiteSchema } from '../../shared/schemas/palpite.schema';
import { JogosModule } from '../jogos/jogos.module';
import { UsersModule } from '../users/users.module';
import { PalpitesController } from './palpites.controller';
import { PalpitesService } from './palpites.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Palpite.name, schema: PalpiteSchema }]),
    JogosModule,
    UsersModule,
  ],
  controllers: [PalpitesController],
  providers: [PalpitesService],
  exports: [PalpitesService, MongooseModule],
})
export class PalpitesModule {}
