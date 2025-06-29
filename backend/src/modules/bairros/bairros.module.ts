import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bairro, BairroSchema } from '../../shared/schemas/bairro.schema';
import { User, UserSchema } from '../../shared/schemas/user.schema';
import { BairrosController } from './bairros.controller';
import { BairrosService } from './bairros.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bairro.name, schema: BairroSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BairrosController],
  providers: [BairrosService],
  exports: [BairrosService],
})
export class BairrosModule {}
