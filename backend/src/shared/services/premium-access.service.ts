import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TipoAcesso,
  UserAcessoPremium,
  UserAcessoPremiumDocument,
} from '../schemas/user-acesso-premium.schema';
import { User, UserDocument } from '../schemas/user.schema';

export interface CustoAcesso {
  cidade: number;
  estado: number;
  nacional: number;
  assinaturaPremiumMensal: number;
}

@Injectable()
export class PremiumAccessService {
  private readonly custos: CustoAcesso = {
    cidade: 50, // 50 moedas por cidade
    estado: 100, // 100 moedas por estado
    nacional: 200, // 200 moedas para acesso nacional
    assinaturaPremiumMensal: 500, // 500 moedas/mês = R$ 30/mês
  };

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserAcessoPremium.name)
    private acessoPremiumModel: Model<UserAcessoPremiumDocument>
  ) {}

  /**
   * Verifica se o usuário tem acesso premium válido
   */
  async verificarAcessoPremium(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return false;

    // Verificar assinatura premium
    if (user.assinaturaPremium) {
      const agora = new Date();
      if (!user.dataVencimentoPremium || user.dataVencimentoPremium > agora) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica se o usuário tem acesso a uma cidade específica
   */
  async temAcessoCidade(userId: string, cidade: string, estado: string): Promise<boolean> {
    // Verificar se tem assinatura premium
    if (await this.verificarAcessoPremium(userId)) {
      return true;
    }

    // Verificar se é a cidade do próprio usuário
    const user = await this.userModel.findById(userId).exec();
    if (user && user.cidade && user.estado) {
      if (user.cidade === cidade && user.estado === estado) {
        return true;
      }
    }

    // Verificar se comprou acesso a esta cidade
    const acesso = await this.acessoPremiumModel
      .findOne({
        userId,
        tipoAcesso: TipoAcesso.CIDADE,
        cidade,
        estado,
        ativo: true,
        $or: [{ dataExpiracao: null }, { dataExpiracao: { $gt: new Date() } }],
      })
      .exec();

    return !!acesso;
  }

  /**
   * Verifica se o usuário tem acesso a um estado específico
   */
  async temAcessoEstado(userId: string, estado: string): Promise<boolean> {
    // Verificar se tem assinatura premium
    if (await this.verificarAcessoPremium(userId)) {
      return true;
    }

    // Verificar se é o estado do próprio usuário
    const user = await this.userModel.findById(userId).exec();
    if (user && user.estado) {
      if (user.estado === estado) {
        return true;
      }
    }

    // Verificar se comprou acesso a este estado
    const acesso = await this.acessoPremiumModel
      .findOne({
        userId,
        tipoAcesso: TipoAcesso.ESTADO,
        estado,
        ativo: true,
        $or: [{ dataExpiracao: null }, { dataExpiracao: { $gt: new Date() } }],
      })
      .exec();

    return !!acesso;
  }

  /**
   * Verifica se o usuário tem acesso nacional
   */
  async temAcessoNacional(userId: string): Promise<boolean> {
    // Verificar se tem assinatura premium
    if (await this.verificarAcessoPremium(userId)) {
      return true;
    }

    // Verificar se comprou acesso nacional
    const acesso = await this.acessoPremiumModel
      .findOne({
        userId,
        tipoAcesso: TipoAcesso.NACIONAL,
        ativo: true,
        $or: [{ dataExpiracao: null }, { dataExpiracao: { $gt: new Date() } }],
      })
      .exec();

    return !!acesso;
  }

  /**
   * Compra acesso a uma cidade específica
   */
  async comprarAcessoCidade(
    userId: string,
    cidade: string,
    estado: string
  ): Promise<{ sucesso: boolean; novoSaldoMoedas: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new ForbiddenException('Usuário não encontrado');
    }

    const custo = this.custos.cidade;
    if (user.moedas < custo) {
      throw new BadRequestException(
        `Moedas insuficientes. Necessário: ${custo}, disponível: ${user.moedas}`
      );
    }

    // Verificar se já tem acesso
    if (await this.temAcessoCidade(userId, cidade, estado)) {
      throw new BadRequestException('Você já tem acesso a esta cidade');
    }

    // Criar acesso e descontar moedas
    const [updatedUser] = await Promise.all([
      this.userModel.findByIdAndUpdate(userId, { $inc: { moedas: -custo } }, { new: true }).exec(),
      this.acessoPremiumModel.create({
        userId,
        tipoAcesso: TipoAcesso.CIDADE,
        cidade,
        estado,
        custoMoedas: custo,
      }),
    ]);

    return {
      sucesso: true,
      novoSaldoMoedas: updatedUser.moedas,
    };
  }

  /**
   * Compra acesso a um estado específico
   */
  async comprarAcessoEstado(
    userId: string,
    estado: string
  ): Promise<{ sucesso: boolean; novoSaldoMoedas: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new ForbiddenException('Usuário não encontrado');
    }

    const custo = this.custos.estado;
    if (user.moedas < custo) {
      throw new BadRequestException(
        `Moedas insuficientes. Necessário: ${custo}, disponível: ${user.moedas}`
      );
    }

    // Verificar se já tem acesso
    if (await this.temAcessoEstado(userId, estado)) {
      throw new BadRequestException('Você já tem acesso a este estado');
    }

    // Criar acesso e descontar moedas
    const [updatedUser] = await Promise.all([
      this.userModel.findByIdAndUpdate(userId, { $inc: { moedas: -custo } }, { new: true }).exec(),
      this.acessoPremiumModel.create({
        userId,
        tipoAcesso: TipoAcesso.ESTADO,
        estado,
        custoMoedas: custo,
      }),
    ]);

    return {
      sucesso: true,
      novoSaldoMoedas: updatedUser.moedas,
    };
  }

  /**
   * Compra acesso nacional
   */
  async comprarAcessoNacional(
    userId: string
  ): Promise<{ sucesso: boolean; novoSaldoMoedas: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new ForbiddenException('Usuário não encontrado');
    }

    const custo = this.custos.nacional;
    if (user.moedas < custo) {
      throw new BadRequestException(
        `Moedas insuficientes. Necessário: ${custo}, disponível: ${user.moedas}`
      );
    }

    // Verificar se já tem acesso
    if (await this.temAcessoNacional(userId)) {
      throw new BadRequestException('Você já tem acesso nacional');
    }

    // Criar acesso e descontar moedas
    const [updatedUser] = await Promise.all([
      this.userModel.findByIdAndUpdate(userId, { $inc: { moedas: -custo } }, { new: true }).exec(),
      this.acessoPremiumModel.create({
        userId,
        tipoAcesso: TipoAcesso.NACIONAL,
        custoMoedas: custo,
      }),
    ]);

    return {
      sucesso: true,
      novoSaldoMoedas: updatedUser.moedas,
    };
  }

  /**
   * Compra assinatura premium mensal (R$ 30/mês = 500 moedas/mês)
   */
  async comprarAssinaturaPremium(
    userId: string,
    meses: number = 1
  ): Promise<{ sucesso: boolean; novoSaldoMoedas: number; dataVencimento: Date }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new ForbiddenException('Usuário não encontrado');
    }

    const custoTotal = this.custos.assinaturaPremiumMensal * meses;
    if (user.moedas < custoTotal) {
      throw new BadRequestException(
        `Moedas insuficientes. Necessário: ${custoTotal}, disponível: ${user.moedas}`
      );
    }

    // Calcular data de vencimento
    const agora = new Date();
    const dataVencimento = new Date(agora);

    // Se já tem assinatura ativa, somar ao vencimento atual
    if (
      user.assinaturaPremium &&
      user.dataVencimentoPremium &&
      user.dataVencimentoPremium > agora
    ) {
      dataVencimento.setTime(user.dataVencimentoPremium.getTime());
    }

    dataVencimento.setMonth(dataVencimento.getMonth() + meses);

    // Atualizar usuário
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $inc: { moedas: -custoTotal },
          $set: {
            assinaturaPremium: true,
            dataVencimentoPremium: dataVencimento,
          },
        },
        { new: true }
      )
      .exec();

    return {
      sucesso: true,
      novoSaldoMoedas: updatedUser.moedas,
      dataVencimento,
    };
  }

  /**
   * Lista acessos do usuário
   */
  async listarAcessosUsuario(userId: string): Promise<{
    assinaturaPremium: boolean;
    dataVencimentoPremium?: Date;
    cidadesAcessiveis: Array<{ cidade: string; estado: string }>;
    estadosAcessiveis: string[];
    temAcessoNacional: boolean;
    custos: CustoAcesso;
  }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      // Em vez de lançar exceção, retornar valores padrão
      return {
        assinaturaPremium: false,
        dataVencimentoPremium: undefined,
        cidadesAcessiveis: [],
        estadosAcessiveis: [],
        temAcessoNacional: false,
        custos: this.custos,
      };
    }

    const acessos = await this.acessoPremiumModel
      .find({
        userId,
        ativo: true,
        $or: [{ dataExpiracao: null }, { dataExpiracao: { $gt: new Date() } }],
      })
      .exec();

    const cidadesAcessiveis: Array<{ cidade: string; estado: string }> = [];
    const estadosAcessiveis: string[] = [];
    let temAcessoNacional = false;

    // Adicionar cidade própria (sempre acessível)
    if (user.cidade && user.estado) {
      cidadesAcessiveis.push({
        cidade: user.cidade,
        estado: user.estado,
      });
      if (!estadosAcessiveis.includes(user.estado)) {
        estadosAcessiveis.push(user.estado);
      }
    }

    // Processar acessos comprados
    for (const acesso of acessos) {
      switch (acesso.tipoAcesso) {
        case TipoAcesso.CIDADE:
          if (acesso.cidade && acesso.estado) {
            const existeCidade = cidadesAcessiveis.find(
              (c) => c.cidade === acesso.cidade && c.estado === acesso.estado
            );
            if (!existeCidade) {
              cidadesAcessiveis.push({ cidade: acesso.cidade, estado: acesso.estado });
            }
          }
          break;
        case TipoAcesso.ESTADO:
          if (acesso.estado && !estadosAcessiveis.includes(acesso.estado)) {
            estadosAcessiveis.push(acesso.estado);
          }
          break;
        case TipoAcesso.NACIONAL:
          temAcessoNacional = true;
          break;
      }
    }

    return {
      assinaturaPremium:
        user.assinaturaPremium &&
        (!user.dataVencimentoPremium || user.dataVencimentoPremium > new Date()),
      dataVencimentoPremium: user.dataVencimentoPremium,
      cidadesAcessiveis,
      estadosAcessiveis,
      temAcessoNacional,
      custos: this.custos,
    };
  }

  /**
   * Obtém custos de acesso
   */
  getCustos(): CustoAcesso {
    return { ...this.custos };
  }
}
