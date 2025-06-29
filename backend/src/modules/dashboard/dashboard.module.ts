import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

// Importar schemas necessários
import { User, UserSchema } from '../../shared/schemas/user.schema';
import { Jogo, JogoSchema } from '../../shared/schemas/jogo.schema';
import { Palpite, PalpiteSchema } from '../../shared/schemas/palpite.schema';
import { Conquista, ConquistaSchema } from '../../shared/schemas/conquista.schema';
import { Bairro, BairroSchema } from '../../shared/schemas/bairro.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Jogo.name, schema: JogoSchema },
      { name: Palpite.name, schema: PalpiteSchema },
      { name: Conquista.name, schema: ConquistaSchema },
      { name: Bairro.name, schema: BairroSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
