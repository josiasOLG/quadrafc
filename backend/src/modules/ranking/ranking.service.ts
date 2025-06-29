import { Injectable } from '@nestjs/common';
import { PremiumAccessService } from '../../shared/services/premium-access.service';

export interface FiltroRanking {
  label: string;
  value: string;
  disponivel: boolean;
  gratuito: boolean;
  custo?: number;
}

@Injectable()
export class RankingService {
  constructor(private premiumAccessService: PremiumAccessService) {}

  async verificarAcessoPremium(userId: string) {
    const acessos = await this.premiumAccessService.listarAcessosUsuario(userId);

    // Verificar se tem acesso premium (assinatura ou acesso nacional)
    const temAcesso = acessos.assinaturaPremium || acessos.temAcessoNacional;

    return {
      temAcesso,
      custoDesbloqueio: acessos.custos.nacional,
      assinaturaPremium: acessos.assinaturaPremium,
      dataVencimentoPremium: acessos.dataVencimentoPremium,
      estadosAcessiveis: acessos.estadosAcessiveis,
      cidadesAcessiveis: acessos.cidadesAcessiveis,
      temAcessoNacional: acessos.temAcessoNacional,
    };
  }

  async listarAcessosDisponiveis(userId: string) {
    return this.premiumAccessService.listarAcessosUsuario(userId);
  }

  async verificarAcessoEspecifico(
    userId: string,
    tipoAcesso: 'cidade' | 'estado' | 'nacional',
    estado?: string,
    cidade?: string
  ) {
    switch (tipoAcesso) {
      case 'cidade':
        if (!cidade || !estado) {
          throw new Error('Cidade e estado são obrigatórios para verificar acesso à cidade');
        }
        const temAcessoCidade = await this.premiumAccessService.temAcessoCidade(
          userId,
          cidade,
          estado
        );
        return {
          temAcesso: temAcessoCidade,
          custoDesbloqueio: this.premiumAccessService.getCustos().cidade,
        };
      case 'estado':
        if (!estado) {
          throw new Error('Estado é obrigatório para verificar acesso ao estado');
        }
        const temAcessoEstado = await this.premiumAccessService.temAcessoEstado(userId, estado);
        return {
          temAcesso: temAcessoEstado,
          custoDesbloqueio: this.premiumAccessService.getCustos().estado,
        };
      case 'nacional':
        const temAcessoNacional = await this.premiumAccessService.temAcessoNacional(userId);
        return {
          temAcesso: temAcessoNacional,
          custoDesbloqueio: this.premiumAccessService.getCustos().nacional,
        };
      default:
        throw new Error('Tipo de acesso inválido');
    }
  }

  async comprarAcessoCidade(userId: string, cidade: string, estado: string) {
    return this.premiumAccessService.comprarAcessoCidade(userId, cidade, estado);
  }

  async comprarAcessoEstado(userId: string, estado: string) {
    return this.premiumAccessService.comprarAcessoEstado(userId, estado);
  }

  async comprarAcessoNacional(userId: string) {
    return this.premiumAccessService.comprarAcessoNacional(userId);
  }

  async comprarAssinaturaPremium(userId: string, meses: number = 1) {
    return this.premiumAccessService.comprarAssinaturaPremium(userId, meses);
  }

  // Manter compatibilidade com método antigo
  async desbloquearRankingNacional(userId: string) {
    return this.premiumAccessService.comprarAcessoNacional(userId);
  }

  async listarFiltrosDisponiveis(userId: string) {
    const acessos = await this.premiumAccessService.listarAcessosUsuario(userId);

    const filtros: FiltroRanking[] = [
      { label: 'Meu Bairro', value: 'bairro', disponivel: true, gratuito: true },
      { label: 'Minha Cidade', value: 'cidade', disponivel: true, gratuito: true },
    ];

    // Estados disponíveis
    if (acessos.assinaturaPremium) {
      // Se tem assinatura premium, libera tudo
      filtros.push(
        { label: 'Meu Estado', value: 'estado', disponivel: true, gratuito: false },
        { label: 'Nacional', value: 'nacional', disponivel: true, gratuito: false }
      );
    } else {
      // Verificar acessos específicos
      if (acessos.estadosAcessiveis.length > 0 || acessos.temAcessoNacional) {
        filtros.push({ label: 'Meu Estado', value: 'estado', disponivel: true, gratuito: false });
      } else {
        filtros.push({
          label: 'Meu Estado',
          value: 'estado',
          disponivel: false,
          gratuito: false,
          custo: acessos.custos.estado,
        });
      }

      if (acessos.temAcessoNacional) {
        filtros.push({ label: 'Nacional', value: 'nacional', disponivel: true, gratuito: false });
      } else {
        filtros.push({
          label: 'Nacional',
          value: 'nacional',
          disponivel: false,
          gratuito: false,
          custo: acessos.custos.nacional,
        });
      }
    }

    return {
      filtros,
      acessos: {
        assinaturaPremium: acessos.assinaturaPremium,
        dataVencimentoPremium: acessos.dataVencimentoPremium,
        estadosAcessiveis: acessos.estadosAcessiveis,
        cidadesAcessiveis: acessos.cidadesAcessiveis,
        temAcessoNacional: acessos.temAcessoNacional,
      },
      custos: acessos.custos,
    };
  }
}
