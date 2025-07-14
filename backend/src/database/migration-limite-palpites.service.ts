import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../shared/schemas/user.schema';

@Injectable()
export class MigrationLimitePalpitesService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async migrarUsuariosComLimitePalpites(): Promise<{ modificados: number; total: number }> {
    const usuariosSemLimite = await this.userModel.find({
      $or: [
        { limitePalpitesDia: { $exists: false } },
        { palpitesHoje: { $exists: false } },
        { ultimoResetPalpites: { $exists: false } },
      ],
    });

    const total = usuariosSemLimite.length;
    let modificados = 0;

    for (const usuario of usuariosSemLimite) {
      const updateData: any = {};

      if (!usuario.limitePalpitesDia) {
        // Define limite padrão baseado na assinatura
        updateData.limitePalpitesDia = this.temAssinaturaPremiumAtiva(usuario) ? 15 : 5;
      }

      if (usuario.palpitesHoje === undefined) {
        updateData.palpitesHoje = 0;
      }

      if (!usuario.ultimoResetPalpites) {
        updateData.ultimoResetPalpites = new Date();
      }

      if (Object.keys(updateData).length > 0) {
        await this.userModel.findByIdAndUpdate(usuario._id, updateData);
        modificados++;
      }
    }

    return { modificados, total };
  }

  private temAssinaturaPremiumAtiva(user: UserDocument): boolean {
    if (user.assinaturaPremium) {
      return true;
    }

    if (user.dataVencimentoPremium) {
      return new Date() <= new Date(user.dataVencimentoPremium);
    }

    return false;
  }
}
