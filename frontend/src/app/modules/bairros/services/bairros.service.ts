import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Bairro, CreateBairroDto, PaginationParams, RankingItem } from '../../../shared/schemas';
import { BaseApiService } from '../../../shared/services/base-api.service';
import { HttpService } from '../../../shared/services/http.service';

@Injectable({
  providedIn: 'root',
})
export class BairrosService extends BaseApiService<Bairro, CreateBairroDto> {
  protected readonly endpoint = 'bairros';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  // Métodos específicos do domínio de bairros
  getBairrosByCidade(cidade: string): Observable<Bairro[]> {
    return this.get<Bairro[]>(`cidade/${encodeURIComponent(cidade)}`);
  }

  getBairrosByEstado(estado: string): Observable<Bairro[]> {
    return this.get<Bairro[]>(`estado/${encodeURIComponent(estado)}`);
  }

  getBairrosByRegiao(regiao: string): Observable<Bairro[]> {
    return this.get<Bairro[]>(`regiao/${encodeURIComponent(regiao)}`);
  }

  searchBairros(termo: string, cidade?: string): Observable<{ data: Bairro[]; pagination: any }> {
    const params: any = { q: termo };
    if (cidade) params.cidade = cidade;

    return this.httpService.getPaginated<Bairro>(`${this.endpoint}/search`, params);
  }

  getRankingBairros(
    params?: PaginationParams
  ): Observable<{ data: RankingItem[]; pagination: any }> {
    return this.getPaginated<RankingItem>('ranking', params);
  }

  getEstatisticasBairro(bairroId: string): Observable<{
    total_usuarios: number;
    usuarios_ativos: number;
    total_palpites: number;
    media_pontuacao: number;
    ranking_posicao: number;
    historico_mensal: {
      mes: string;
      pontos: number;
      posicao: number;
    }[];
  }> {
    return this.get(`${bairroId}/estatisticas`);
  }

  getMeuBairro(): Observable<Bairro> {
    return this.get<Bairro>('meu-bairro');
  }

  getTopBairros(limite?: number): Observable<Bairro[]> {
    return this.get<Bairro[]>('top', { limite });
  }

  getCidades(): Observable<string[]> {
    return this.get<string[]>('cidades');
  }

  getEstados(): Observable<string[]> {
    return this.get<string[]>('estados');
  }

  getRegioes(): Observable<string[]> {
    return this.get<string[]>('regioes');
  }

  // Métodos admin
  atualizarEstatisticas(bairroId: string): Observable<Bairro> {
    return this.postGlobal(`admin/bairros/${bairroId}/atualizar-estatisticas`);
  }

  recalcularRanking(): Observable<{ bairros_atualizados: number }> {
    return this.postGlobal('admin/bairros/recalcular-ranking');
  }

  // Método para criar bairro com validação
  createWithValidation(bairroData: {
    nome: string;
    cidade: string;
    estado: string;
    cep?: string;
  }): Observable<{ success: boolean; bairro?: Bairro; message: string; similares?: Bairro[] }> {
    return this.post('criar-com-validacao', bairroData);
  }
}
