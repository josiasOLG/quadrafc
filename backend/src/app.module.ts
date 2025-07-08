import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { SeedService } from './database/seed.service'; // Reativado para criar dados iniciais
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { PremiumAccessModule } from './shared/modules/premium-access.module';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { BairrosModule } from './modules/bairros/bairros.module';
import { CepModule } from './modules/cep/cep.module';
import { CidadesModule } from './modules/cidades/cidades.module';
import { ConquistasModule } from './modules/conquistas/conquistas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FootballApiModule } from './modules/football-api/football-api.module';
import { JogosModule } from './modules/jogos/jogos.module';
import { PalpitesModule } from './modules/palpites/palpites.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { RodadasModule } from './modules/rodadas/rodadas.module';
import { SincronizacaoModule } from './modules/sincronizacao/sincronizacao.module';
import { TransacoesMoedasModule } from './modules/transacoes-moedas/transacoes-moedas.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('DATABASE_NAME'),
      }),
      inject: [ConfigService],
    }),

    // Schedule for cron jobs
    ScheduleModule.forRoot(),

    // Global modules
    PremiumAccessModule,

    // Feature modules
    AuthModule,
    UsersModule,
    BairrosModule,
    CidadesModule,
    JogosModule,
    RodadasModule,
    PalpitesModule,
    TransacoesMoedasModule,
    FootballApiModule,
    ConquistasModule,
    DashboardModule,
    SincronizacaoModule,
    RankingModule,
    CepModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Temporariamente desabilitado para testar CORS
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: SessionRefreshInterceptor,
    // },
    SeedService, // Reativado para criar bairros e usuários iniciais para ranking
  ],
})
export class AppModule {}
