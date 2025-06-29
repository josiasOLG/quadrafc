import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransacaoMoeda, TransacaoMoedaSchema } from '../../shared/schemas/transacao-moeda.schema';
import { TransacoesMoedasService } from './transacoes-moedas.service';
import { TransacoesMoedasController } from './transacoes-moedas.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TransacaoMoeda.name, schema: TransacaoMoedaSchema }]),
  ],
  controllers: [TransacoesMoedasController],
  providers: [TransacoesMoedasService],
  exports: [TransacoesMoedasService],
})
export class TransacoesMoedasModule {}
