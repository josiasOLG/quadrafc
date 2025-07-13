import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateJogoDto, Jogo, PaginationParams } from '../../../shared/schemas';
import { BaseApiService } from '../../../shared/services/base-api.service';
import { HttpService } from '../../../shared/services/http.service';

@Injectable({
  providedIn: 'root',
})
export class JogosService extends BaseApiService<Jogo, CreateJogoDto> {
  protected readonly endpoint = 'jogos';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  // Métodos específicos do domínio de jogos
  getJogosRodadaAtual(): Observable<Jogo[]> {
    return this.get<Jogo[]>('rodada-atual');
  }

  getJogosByStatus(
    status: 'agendado' | 'ao_vivo' | 'finalizado' | 'adiado' | 'cancelado'
  ): Observable<Jogo[]> {
    return this.get<Jogo[]>(`status/${status}`);
  }

  getProximosJogos(limit?: number): Observable<Jogo[]> {
    const params = limit ? { limit } : {};
    return this.get<Jogo[]>('proximos', params);
  }

  getResultados(params?: PaginationParams): Observable<{ data: Jogo[]; pagination: any }> {
    return this.getPaginated<Jogo>('resultados', params);
  }

  getJogosByTime(
    time: string,
    params?: PaginationParams
  ): Observable<{ data: Jogo[]; pagination: any }> {
    return this.getPaginated<Jogo>(`time/${encodeURIComponent(time)}`, params);
  }

  getJogosByCampeonato(
    campeonato: string,
    params?: PaginationParams
  ): Observable<{ data: Jogo[]; pagination: any }> {
    return this.getPaginated<Jogo>(`campeonato/${encodeURIComponent(campeonato)}`, params);
  }

  getJogosByData(data: Date): Observable<Jogo[]> {
    const dataStr = data.toISOString().split('T')[0];
    return this.get<Jogo[]>(`data/${dataStr}`);
  }

  updateResultado(
    id: string,
    resultado: { gols_casa: number; gols_visitante: number }
  ): Observable<Jogo> {
    return this.patch<Jogo>(`${id}/resultado`, resultado);
  }

  getEstatisticas(): Observable<any> {
    return this.get<any>('estatisticas');
  }

  getTimes(): Observable<string[]> {
    return this.get<string[]>('times');
  }

  getCampeonatos(): Observable<string[]> {
    return this.get<string[]>('campeonatos');
  }

  getJogosPorCampeonatos(dataInicial: string, limite: number): Observable<any> {
    return this.get<any>(`campeonatos/${dataInicial}/${limite}`);
  }

  getJogosHojePorCampeonatos(): Observable<any> {
    return this.get<any>('campeonatos/hoje');
  }

  getJogosByDataComCampeonatos(data: string): Observable<any> {
    return this.get<any>(`data/${data}/campeonatos`);
  }
}
