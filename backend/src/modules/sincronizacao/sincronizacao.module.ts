import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Palpite, PalpiteSchema } from '../../shared/schemas/palpite.schema';
import { User, UserSchema } from '../../shared/schemas/user.schema';
import { FootballApiModule } from '../football-api/football-api.module';
import { JogosModule } from '../jogos/jogos.module';
import { SincronizacaoController } from './sincronizacao.controller';
import { SincronizacaoService } from './sincronizacao.service';

@Module({
  imports: [
    JogosModule,
    FootballApiModule,
    MongooseModule.forFeature([
      { name: Palpite.name, schema: PalpiteSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SincronizacaoController],
  providers: [SincronizacaoService],
  exports: [SincronizacaoService],
})
export class SincronizacaoModule {}
