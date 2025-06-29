import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginationParams, RankingItem } from '../../../shared/schemas';
import { HttpService } from '../../../shared/services/http.service';

export interface RankingUsuario extends RankingItem {
  nivel: number;
  sequencia_atual: number;
  palpites_corretos: number;
  total_palpites: number;
  taxa_acerto: number;
}

export interface RankingBairro {
  bairro: string;
  cidade: string;
  estado: string;
  pontos_totais: number;
  usuarios_ativos: number;
  media_pontos_usuario: number;
  posicao: number;
}

@Injectable({
  providedIn: 'root',
})
export class RankingService {
  constructor(private httpService: HttpService) {}

  // Ranking geral de usuários
  getRankingUsuarios(
    params?: PaginationParams
  ): Observable<{ data: RankingUsuario[]; pagination: any }> {
    return this.httpService.getPaginated<RankingUsuario>('users/ranking', params);
  }

  // Ranking de usuários por bairro
  getRankingUsuariosPorBairro(
    bairroId: string,
    params?: PaginationParams
  ): Observable<{ data: RankingUsuario[]; pagination: any }> {
    return this.httpService.getPaginated<RankingUsuario>(
      `ranking/usuarios/bairro/${bairroId}`,
      params
    );
  }

  // Ranking de bairros
  getRankingBairros(
    params?: PaginationParams
  ): Observable<{ data: RankingBairro[]; pagination: any }> {
    return this.httpService.getPaginated<RankingBairro>('bairros/ranking', params);
  }

  // Ranking de bairros da mesma cidade (gratuito)
  getRankingBairrosCidade(
    params?: PaginationParams
  ): Observable<{ data: RankingBairro[]; pagination: any }> {
    return this.httpService.getPaginated<RankingBairro>('bairros/ranking/minha-cidade', params);
  }

  // Ranking de bairros nacional (premium)
  getRankingBairrosNacional(
    params?: PaginationParams
  ): Observable<{ data: RankingBairro[]; pagination: any }> {
    return this.httpService.getPaginated<RankingBairro>('bairros/ranking/nacional', params);
  }

  // Verificar se usuário tem acesso premium para ranking nacional
  verificarAcessoPremium(): Observable<{ temAcesso: boolean; custoDesbloqueio?: number }> {
    return this.httpService.get('ranking/verificar-premium');
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
    return this.httpService.get('ranking/filtros-disponiveis');
  }

  // Desbloquear ranking nacional (custo em moedas)
  desbloquearRankingNacional(): Observable<{ sucesso: boolean; novoSaldoMoedas: number }> {
    return this.httpService.post('ranking/desbloquear-nacional');
  }

  // Comprar acesso a uma cidade específica
  comprarAcessoCidade(
    cidade: string,
    estado: string
  ): Observable<{ sucesso: boolean; novoSaldoMoedas: number }> {
    return this.httpService.post('ranking/comprar-acesso-cidade', { cidade, estado });
  }

  // Comprar acesso a um estado específico
  comprarAcessoEstado(estado: string): Observable<{ sucesso: boolean; novoSaldoMoedas: number }> {
    return this.httpService.post('ranking/comprar-acesso-estado', { estado });
  }

  // Comprar acesso nacional
  comprarAcessoNacional(): Observable<{ sucesso: boolean; novoSaldoMoedas: number }> {
    return this.httpService.post('ranking/comprar-acesso-nacional');
  }

  // Comprar assinatura premium vitalícia (R$ 30/mês = 500 moedas/mês)
  comprarAssinaturaPremium(meses = 1): Observable<{
    sucesso: boolean;
    novoSaldoMoedas: number;
    dataVencimento: Date;
  }> {
    return this.httpService.post('ranking/comprar-assinatura-premium', { meses });
  }

  // Ranking da rodada atual
  getRankingRodadaAtual(
    params?: PaginationParams
  ): Observable<{ data: RankingUsuario[]; pagination: any }> {
    return this.httpService.getPaginated<RankingUsuario>('ranking/rodada-atual', params);
  }

  // Ranking por rodada específica
  getRankingPorRodada(
    rodadaId: string,
    params?: PaginationParams
  ): Observable<{ data: RankingUsuario[]; pagination: any }> {
    return this.httpService.getPaginated<RankingUsuario>(`ranking/rodada/${rodadaId}`, params);
  }

  // Minha posição no ranking geral
  getMinhaPosicao(): Observable<{
    posicao_geral: number;
    posicao_bairro: number;
    posicao_rodada: number;
    pontos_totais: number;
    pontos_para_subir: number;
  }> {
    return this.httpService.get('ranking/minha-posicao');
  }

  // Top 10 usuários
  getTop10Usuarios(): Observable<RankingUsuario[]> {
    return this.httpService.get<RankingUsuario[]>('ranking/top10-usuarios');
  }

  // Top 10 bairros
  getTop10Bairros(): Observable<RankingBairro[]> {
    return this.httpService.get<RankingBairro[]>('ranking/top10-bairros');
  }

  // Histórico de ranking do usuário
  getHistoricoRanking(periodo?: 'semana' | 'mes' | 'ano'): Observable<
    {
      data: Date;
      posicao: number;
      pontos: number;
    }[]
  > {
    return this.httpService.get('ranking/meu-historico', { periodo });
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
    return this.httpService.post('ranking/comparar', { usuarios: usuarioIds });
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
    return this.httpService.get('ranking/estatisticas');
  }

  // Admin: Recalcular rankings
  recalcularRankings(): Observable<{ message: string; usuarios_atualizados: number }> {
    return this.httpService.post('admin/ranking/recalcular');
  }

  // Teste de autenticação
  testeAuth(): Observable<{ userInfo: any; userId: string; message: string }> {
    return this.httpService.get('ranking/teste-auth');
  }
}
