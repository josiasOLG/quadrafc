import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConquistasController } from './conquistas.controller';
import { ConquistasService } from './conquistas.service';
import { Conquista, ConquistaSchema } from '../../shared/schemas/conquista.schema';
import { ConquistaUsuario, ConquistaUsuarioSchema } from '../../shared/schemas/conquista-usuario.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conquista.name, schema: ConquistaSchema },
      { name: ConquistaUsuario.name, schema: ConquistaUsuarioSchema }
    ])
  ],
  controllers: [ConquistasController],
  providers: [ConquistasService],
  exports: [ConquistasService]
})
export class ConquistasModule {}
