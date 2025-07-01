import { Module } from '@nestjs/common';
import { SeedService } from '../../database/seed.service';
import { BairrosModule } from '../bairros/bairros.module';
import { JogosModule } from '../jogos/jogos.module';
import { PalpitesModule } from '../palpites/palpites.module';
import { RodadasModule } from '../rodadas/rodadas.module';
import { TransacoesMoedasModule } from '../transacoes-moedas/transacoes-moedas.module';
import { UsersModule } from '../users/users.module';
import { SeedController } from './seed.controller';

@Module({
  imports: [
    BairrosModule,
    UsersModule,
    RodadasModule,
    JogosModule,
    PalpitesModule,
    TransacoesMoedasModule,
  ],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
