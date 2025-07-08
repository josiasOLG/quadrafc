import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginationParams } from '../../../shared/schemas';
import { BaseApiService } from '../../../shared/services/base-api.service';
import { HttpService } from '../../../shared/services/http.service';

export interface RankingUsuario {
  _id: string;
  nome: string;
  pontos_totais: number;
  nivel: number;
  sequencia_atual: number;
  palpites_corretos: number;
  total_palpites: number;
  taxa_acerto: number;
  bairro: string;
  cidade: string;
  estado: string;
  avatar?: string;
  avatarUrl?: string;
  posicao: number;
  isCurrentUser?: boolean;
}

export interface RankingBairro {
  bairro: string;
  cidade: string;
  estado: string;
  pontos_totais: number;
  usuarios_ativos: number;
  media_pontuacao: number;
  posicao: number;
}

@Injectable({
  providedIn: 'root',
})
export class RankingService extends BaseApiService<RankingUsuario, any> {
  protected readonly endpoint = 'ranking';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  // Métodos específicos do domínio de ranking

  // Ranking de usuários da cidade especificada
  getRankingUsuariosCidade(
    cidade: string,
    estado: string,
    params?: PaginationParams
  ): Observable<{ data: RankingUsuario[]; pagination: any }> {
    const queryParams = {
      cidade,
      estado,
      ...params,
    };
    return this.getPaginated<RankingUsuario>('usuarios-cidade', queryParams);
  }

  // Ranking de bairros da cidade especificada
  getRankingBairrosCidade(
    cidade: string,
    estado: string,
    params?: PaginationParams
  ): Observable<{ data: RankingBairro[]; pagination: any }> {
    const queryParams = {
      cidade,
      estado,
      ...params,
    };
    return this.getPaginated<RankingBairro>('bairros-cidade', queryParams);
  }

  // Ranking de bairros nacional (premium)
  getRankingBairrosNacional(
    params?: PaginationParams
  ): Observable<{ data: RankingBairro[]; pagination: any }> {
    return this.getPaginated<RankingBairro>('ranking/nacional', params);
  }

  // Verificar se usuário tem acesso premium para ranking nacional
  verificarAcessoPremium(): Observable<{ temAcesso: boolean; custoDesbloqueio?: number }> {
    return this.get('verificar-premium');
  }

  // Buscar filtros disponíveis baseado nos acessos do usuário
  getFiltrosDisponiveis(): Observable<{
    filtros: {
      label: string;
      value: string;
      disponivel: boolean;
      gratuito: boolean;
      custo?: number;
    }[];
    acessos: {
      assinaturaPremium: boolean;
      dataVencimentoPremium?: Date;
      estadosAcessiveis: string[];
      cidadesAcessiveis: { cidade: string; estado: string }[];
      temAcessoNacional: boolean;
    };
    custos: {
      cidade: number;
      estado: number;
      nacional: number;
      assinaturaPremiumMensal: number;
    };
  }> {
    return this.get('filtros-disponiveis');
  }

  // Desbloquear ranking nacional (custo em moedas)
  desbloquearRankingNacional(): Observable<{ sucesso: boolean; novoSaldoMoedas: number }> {
    return this.post('desbloquear-nacional');
  }

  // Comprar acesso a uma cidade específica
  comprarAcessoCidade(
    cidade: string,
    estado: string
  ): Observable<{ sucesso: boolean; novoSaldoMoedas: number }> {
    return this.post('comprar-acesso-cidade', { cidade, estado });
  }

  // Comprar acesso a um estado específico
  comprarAcessoEstado(estado: string): Observable<{ sucesso: boolean; novoSaldoMoedas: number }> {
    return this.post('comprar-acesso-estado', { estado });
  }

  // Comprar acesso nacional
  comprarAcessoNacional(): Observable<{ sucesso: boolean; novoSaldoMoedas: number }> {
    return this.post('comprar-acesso-nacional');
  }

  // Comprar assinatura premium vitalícia (R$ 30/mês = 500 moedas/mês)
  comprarAssinaturaPremium(meses = 1): Observable<{
    sucesso: boolean;
    novoSaldoMoedas: number;
    dataVencimento: Date;
  }> {
    return this.post('comprar-assinatura-premium', { meses });
  }

  // Ranking da rodada atual
  getRankingRodadaAtual(
    params?: PaginationParams
  ): Observable<{ data: RankingUsuario[]; pagination: any }> {
    return this.getPaginated<RankingUsuario>('rodada-atual', params);
  }

  // Ranking por rodada específica
  getRankingPorRodada(
    rodadaId: string,
    params?: PaginationParams
  ): Observable<{ data: RankingUsuario[]; pagination: any }> {
    return this.getPaginated<RankingUsuario>(`rodada/${rodadaId}`, params);
  }

  // Minha posição no ranking geral
  getMinhaPosicao(): Observable<{
    posicao_geral: number;
    posicao_bairro: number;
    posicao_rodada: number;
    pontos_totais: number;
    pontos_para_subir: number;
  }> {
    return this.get('minha-posicao');
  }

  // Top 10 usuários
  getTop10Usuarios(): Observable<RankingUsuario[]> {
    return this.get<RankingUsuario[]>('top10-usuarios');
  }

  // Top 10 bairros
  getTop10Bairros(): Observable<RankingBairro[]> {
    return this.get<RankingBairro[]>('top10-bairros');
  }

  // Histórico de ranking do usuário
  getHistoricoRanking(periodo?: 'semana' | 'mes' | 'ano'): Observable<
    {
      data: Date;
      posicao: number;
      pontos: number;
    }[]
  > {
    return this.get('meu-historico', { periodo });
  }

  // Comparar com outros usuários
  compararUsuarios(usuarioIds: string[]): Observable<
    {
      usuario: string;
      nome: string;
      pontos: number;
      posicao: number;
      palpites_corretos: number;
      taxa_acerto: number;
    }[]
  > {
    return this.post('comparar', { usuarios: usuarioIds });
  }

  // Estatísticas gerais do ranking
  getEstatisticasRanking(): Observable<{
    total_usuarios: number;
    media_pontos: number;
    maior_pontuacao: number;
    melhor_sequencia: number;
    total_bairros: number;
    usuarios_ativos_mes: number;
  }> {
    return this.get('estatisticas');
  }

  // Teste de autenticação
  testeAuth(): Observable<{ userInfo: any; userId: string; message: string }> {
    return this.get('teste-auth');
  }
}
