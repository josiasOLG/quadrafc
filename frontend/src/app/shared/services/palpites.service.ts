import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Palpite, CreatePalpiteDto } from '../schemas/palpite.schema';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class PalpitesService extends BaseApiService<Palpite, CreatePalpiteDto> {
  protected readonly endpoint = 'palpites';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  // Métodos específicos do domínio de palpites
  getPalpitesByUser(userId?: string): Observable<Palpite[]> {
    const endpoint = userId ? `user/${userId}` : 'user';
    return this.get<Palpite[]>(endpoint);
  }

  getMeusPalpites(params?: any): Observable<any> {
    return this.get<any>('meus', params);
  }

  getMinhasEstatisticas(): Observable<any> {
    return this.get<any>('minhas-estatisticas');
  }

  getPalpitesByJogo(jogoId: string): Observable<Palpite[]> {
    return this.get<Palpite[]>(`jogo/${jogoId}`);
  }

  getPalpitesRecentes(limit?: number): Observable<Palpite[]> {
    const params = limit ? { limit } : {};
    return this.get<Palpite[]>('recentes', params);
  }

  getEstatisticas(): Observable<any> {
    return this.get<any>('estatisticas');
  }

  verificarResultados(): Observable<any> {
    return this.post<any>('verificar-resultados', {});
  }
}
