import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Jogo, JogoCreate, JogoFilters, JogoListResponse, JogoUpdate } from '../models/jogo.model';

@Injectable({
  providedIn: 'root',
})
export class JogoService {
  private apiUrl = `${environment.apiUrl}/jogos`;

  constructor(private http: HttpClient) {}

  getJogos(filters?: JogoFilters): Observable<JogoListResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof JogoFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<any>(this.apiUrl, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          let jogos: Jogo[];

          // O backend pode retornar { success: true, data: [...] } ou diretamente [...]
          if (response.data) {
            jogos = Array.isArray(response.data) ? response.data : [];
          } else if (Array.isArray(response)) {
            jogos = response;
          } else {
            jogos = [];
          }

          // Aplicar paginação no frontend (já que backend não suporta)
          const page = filters?.page || 1;
          const limit = filters?.limit || 10;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;

          return {
            data: jogos.slice(startIndex, endIndex),
            total: jogos.length,
            page,
            limit,
          } as JogoListResponse;
        })
      );
  }

  getJogoById(id: string | number): Observable<Jogo> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { withCredentials: true }).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data as Jogo;
        }
        return response as Jogo;
      })
    );
  }

  // Métodos para CRUD de jogos
  createJogo(jogo: JogoCreate): Observable<Jogo> {
    return this.http.post<any>(this.apiUrl, jogo, { withCredentials: true }).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data as Jogo;
        }
        return response as Jogo;
      })
    );
  }

  updateJogo(id: number | string, jogo: JogoUpdate): Observable<Jogo> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, jogo, { withCredentials: true }).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data as Jogo;
        }
        return response as Jogo;
      })
    );
  }

  deleteJogo(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  // Método atualizado para buscar jogos por campeonatos
  getJogosPorCampeonatosAtualizado(
    dataInicial?: string,
    dataFinal?: string,
    page: number = 1,
    limit: number = 100
  ): Observable<any> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (dataInicial) {
      params = params.set('dataInicial', dataInicial);
    }
    if (dataFinal) {
      params = params.set('dataFinal', dataFinal);
    }

    return this.http
      .get<any>(`${this.apiUrl}/por-campeonatos`, { params, withCredentials: true })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  getJogosAbertos(): Observable<Jogo[]> {
    return this.http.get<any>(`${this.apiUrl}/abertos`, { withCredentials: true }).pipe(
      map((response: any) => {
        if (response.data) {
          return Array.isArray(response.data) ? response.data : [];
        }
        return Array.isArray(response) ? response : [];
      })
    );
  }

  getJogosByData(data: string): Observable<Jogo[]> {
    return this.http.get<any>(`${this.apiUrl}/data/${data}`, { withCredentials: true }).pipe(
      map((response: any) => {
        if (response.data) {
          return Array.isArray(response.data) ? response.data : [];
        }
        return Array.isArray(response) ? response : [];
      })
    );
  }

  getJogosByDataComCampeonatos(data: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/data/${data}/campeonatos`, { withCredentials: true })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  getJogosByRange(dataInicial: string, dias: number): Observable<Jogo[]> {
    return this.http
      .get<any>(`${this.apiUrl}/range/${dataInicial}/${dias}`, { withCredentials: true })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return Array.isArray(response.data) ? response.data : [];
          }
          return Array.isArray(response) ? response : [];
        })
      );
  }

  getJogosPorCampeonatos(dataInicial: string, dias: number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/campeonatos/${dataInicial}/${dias}`, { withCredentials: true })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  getJogosHojePorCampeonatos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/campeonatos/hoje`, { withCredentials: true }).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  sincronizarJogos(data: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/sincronizar/${data}`, {}, { withCredentials: true })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  obterStatusSincronizacao(data: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/sincronizacao/status/${data}`, { withCredentials: true })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  // Método para atualizar resultado
  updateResult(id: number | string, golsTimeA: number, golsTimeB: number): Observable<Jogo> {
    return this.http
      .put<any>(
        `${this.apiUrl}/${id}/resultado`,
        {
          timeA: golsTimeA,
          timeB: golsTimeB,
        },
        { withCredentials: true }
      )
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data as Jogo;
          }
          return response as Jogo;
        })
      );
  }

  getJogosStats(): Observable<any> {
    // Could be implemented by aggregating data from getJogos
    return this.http.get(`${this.apiUrl}/debug/todos`);
  }

  /**
   * Sincroniza jogos em um range de datas (novos recursos do backend)
   */
  sincronizarJogosRange(dataInicial: string, diasNoFuturo: number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/campeonatos/${dataInicial}/${diasNoFuturo}`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  /**
   * Força inicialização das competições brasileiras
   */
  inicializarCompeticoesBrasileiras(): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/inicializar-competicoes`, {}, { withCredentials: true })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  /**
   * Lista competições brasileiras descobertas
   */
  listarCompeticoesBrasileiras(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/competicoes-brasileiras`, { withCredentials: true })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  /**
   * Busca jogos finalizados para teste
   */
  buscarJogosFinalizados(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/finalizados`, { withCredentials: true }).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Lista TODAS as competições descobertas (brasileiras e internacionais)
   */
  listarTodasCompeticoes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/todas-competicoes`, { withCredentials: true }).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Sincroniza jogos de TODAS as competições em um range de datas
   */
  sincronizarTodasCompeticoes(dataInicial: string, diasNoFuturo: number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/sincronizar/todas-competicoes/${dataInicial}/${diasNoFuturo}`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  /**
   * Sincronização COMPLETA: inicializa competições + busca jogos + salva no MongoDB
   */
  sincronizarESalvarTodasCompeticoes(dataInicial: string, diasNoFuturo: number): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/sincronizar-salvar-todas-competicoes/${dataInicial}/${diasNoFuturo}`,
        {},
        {
          withCredentials: true,
        }
      )
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  /**
   * Busca jogos de TODAS as competições organizados por campeonatos
   */
  buscarJogosTodasCompeticoes(dataInicial: string, diasNoFuturo: number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/campeonatos/todos/${dataInicial}/${diasNoFuturo}`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  /**
   * Força inicialização de TODAS as competições
   */
  inicializarTodasCompeticoes(): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/inicializar-competicoes`, {}, { withCredentials: true })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  /**
   * Métodos para integração com módulo de sincronização
   */
  sincronizacaoManualTodasCompeticoes(dataInicial: string, dias: number): Observable<any> {
    const apiUrl = `${environment.apiUrl}/sincronizacao`;
    return this.http
      .post<any>(
        `${apiUrl}/todas-competicoes/${dataInicial}/${dias}`,
        {},
        { withCredentials: true }
      )
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  /**
   * Verificação manual de jogos finalizados e processamento de palpites
   */
  verificarJogosFinalizados(): Observable<any> {
    const apiUrl = `${environment.apiUrl}/sincronizacao`;
    return this.http
      .post<any>(`${apiUrl}/verificar-jogos-finalizados`, {}, { withCredentials: true })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  /**
   * Status dos crons de sincronização
   */
  obterStatusCrons(): Observable<any> {
    const apiUrl = `${environment.apiUrl}/sincronizacao`;
    return this.http.get<any>(`${apiUrl}/status`, { withCredentials: true }).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Sincronizar os próximos 60 dias (de 10 em 10 dias) e salvar todos os jogos no MongoDB por campeonato
   */
  sincronizarGlobal60Dias(): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/sincronizar-global-60-dias`,
        {},
        {
          withCredentials: true,
        }
      )
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  /**
   * Sincroniza e salva jogos de TODAS as competições mundiais (método antigo)
   */
  sincronizarESalvarJogosAntigo(dataInicial: string, diasNoFuturo: number): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/sincronizar-salvar/${dataInicial}/${diasNoFuturo}`,
        {},
        {
          withCredentials: true,
        }
      )
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }
}
