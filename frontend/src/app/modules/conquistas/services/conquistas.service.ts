import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../shared/services/base-api.service';
import { HttpService } from '../../../shared/services/http.service';
import { Conquista, ConquistaUsuario, CreateConquistaDto } from '../../../shared/schemas';

@Injectable({
  providedIn: 'root'
})
export class ConquistasService extends BaseApiService<Conquista, CreateConquistaDto> {
  protected readonly endpoint = 'conquistas';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  // Métodos específicos para conquistas
  getMinhasConquistas(): Observable<{ data: ConquistaUsuario[]; pagination: any }> {
    return this.httpService.getPaginated<ConquistaUsuario>(`${this.endpoint}/minhas`);
  }

  getConquistasDisponiveis(): Observable<{ data: Conquista[]; pagination: any }> {
    return this.httpService.getPaginated<Conquista>(`${this.endpoint}/disponiveis`);
  }

  getProgressoConquistas(): Observable<{ data: ConquistaUsuario[]; pagination: any }> {
    return this.httpService.getPaginated<ConquistaUsuario>(`${this.endpoint}/progresso`);
  }

  reivindicarConquista(conquistaId: string): Observable<{ message: string; recompensas: any }> {
    return this.httpService.post<{ message: string; recompensas: any }>(`${this.endpoint}/reivindicar/${conquistaId}`);
  }

  getEstatisticasConquistas(): Observable<{
    total_conquistas: number;
    conquistas_completadas: number;
    pontos_totais: number;
    moedas_totais: number;
    por_categoria: Record<string, number>;
    por_tipo: Record<string, number>;
  }> {
    return this.httpService.get<any>(`${this.endpoint}/estatisticas`);
  }
}
