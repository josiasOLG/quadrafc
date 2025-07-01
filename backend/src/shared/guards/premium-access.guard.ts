import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PREMIUM_ACCESS_KEY,
  PremiumAccessRequirement,
} from '../decorators/premium-access.decorator';
import {
  TipoAcesso,
  UserAcessoPremium,
  UserAcessoPremiumDocument,
} from '../schemas/user-acesso-premium.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class PremiumAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserAcessoPremium.name)
    private acessoPremiumModel: Model<UserAcessoPremiumDocument>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PremiumAccessRequirement>(
      PREMIUM_ACCESS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requirement) {
      return true; // Sem restrição de acesso premium
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Buscar dados do usuário
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new ForbiddenException('Usuário não encontrado');
    }

    // Se é admin, libera tudo
    if (user.isAdmin) {
      return true;
    }

    // Se permite assinatura premium e usuário tem assinatura vitalícia ativa
    if (requirement.allowPremiumSubscription && user.assinaturaPremium) {
      const agora = new Date();
      if (!user.dataVencimentoPremium || user.dataVencimentoPremium > agora) {
        return true;
      }
    }

    // Verificar acesso específico baseado no tipo
    return await this.verificarAcessoEspecifico(userId, requirement, request, user);
  }

  private async verificarAcessoEspecifico(
    userId: string,
    requirement: PremiumAccessRequirement,
    request: any,
    user: any
  ): Promise<boolean> {
    const { tipoAcesso, allowOwnCityOnly, specificState, specificCity } = requirement;

    switch (tipoAcesso) {
      case TipoAcesso.CIDADE:
        return await this.verificarAcessoCidade(
          userId,
          request,
          user,
          allowOwnCityOnly,
          specificCity,
          specificState
        );

      case TipoAcesso.ESTADO:
        return await this.verificarAcessoEstado(userId, request, user, specificState);

      case TipoAcesso.NACIONAL:
        return await this.verificarAcessoNacional(userId);

      default:
        return false;
    }
  }

  private async verificarAcessoCidade(
    userId: string,
    request: any,
    user: any,
    allowOwnCityOnly: boolean = true,
    specificCity?: string,
    specificState?: string
  ): Promise<boolean> {
    const cidadeParam = specificCity || request.params?.cidade || request.query?.cidade;
    const estadoParam = specificState || request.params?.estado || request.query?.estado;

    const userBairro = user.bairroId as any;
    if (!userBairro && allowOwnCityOnly) {
      throw new ForbiddenException('Usuário sem bairro definido');
    }

    // Se permite apenas cidade própria e é a mesma cidade do usuário
    if (allowOwnCityOnly && userBairro) {
      if (
        !cidadeParam ||
        (cidadeParam === userBairro.cidade && (!estadoParam || estadoParam === userBairro.estado))
      ) {
        return true;
      }
    }

    // Se não especificou cidade e permite cidade própria, libera
    if (!cidadeParam && allowOwnCityOnly) {
      return true;
    }

    // Verificar se comprou acesso a esta cidade específica
    if (cidadeParam) {
      const acesso = await this.acessoPremiumModel
        .findOne({
          userId,
          tipoAcesso: TipoAcesso.CIDADE,
          cidade: cidadeParam,
          estado: estadoParam,
          ativo: true,
          $or: [{ dataExpiracao: null }, { dataExpiracao: { $gt: new Date() } }],
        })
        .exec();

      if (acesso) {
        return true;
      }
    }

    throw new ForbiddenException(
      `Acesso negado à cidade ${cidadeParam || 'especificada'}. Compre o acesso premium.`
    );
  }

  private async verificarAcessoEstado(
    userId: string,
    request: any,
    user: any,
    specificState?: string
  ): Promise<boolean> {
    const estadoParam = specificState || request.params?.estado || request.query?.estado;

    const userBairro = user.bairroId as any;

    // Se é o mesmo estado do usuário, permite
    if (userBairro && (!estadoParam || estadoParam === userBairro.estado)) {
      return true;
    }

    // Se não especificou estado, permite acesso ao próprio estado
    if (!estadoParam) {
      return true;
    }

    // Verificar se comprou acesso a este estado
    const acesso = await this.acessoPremiumModel
      .findOne({
        userId,
        tipoAcesso: TipoAcesso.ESTADO,
        estado: estadoParam,
        ativo: true,
        $or: [{ dataExpiracao: null }, { dataExpiracao: { $gt: new Date() } }],
      })
      .exec();

    if (!acesso) {
      throw new ForbiddenException(
        `Acesso negado ao estado ${estadoParam}. Compre o acesso premium.`
      );
    }

    return true;
  }

  private async verificarAcessoNacional(userId: string): Promise<boolean> {
    const acesso = await this.acessoPremiumModel
      .findOne({
        userId,
        tipoAcesso: TipoAcesso.NACIONAL,
        ativo: true,
        $or: [{ dataExpiracao: null }, { dataExpiracao: { $gt: new Date() } }],
      })
      .exec();

    if (!acesso) {
      throw new ForbiddenException('Acesso negado ao ranking nacional. Compre o acesso premium.');
    }

    return true;
  }
}
