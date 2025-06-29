import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Jogo, JogoSchema } from '../../shared/schemas/jogo.schema';
import { Sincronizacao, SincronizacaoSchema } from '../../shared/schemas/sincronizacao.schema';
import { JogosService } from './jogos.service';
import { JogosController } from './jogos.controller';
import { FootballApiModule } from '../football-api/football-api.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Jogo.name, schema: JogoSchema },
      { name: Sincronizacao.name, schema: SincronizacaoSchema }
    ]),
    FootballApiModule,
  ],
  controllers: [JogosController],
  providers: [JogosService],
  exports: [JogosService],
})
export class JogosModule {}
