import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalUsuarios: number;
  totalJogos: number;
  totalPalpites: number;
  totalBairros: number;
  usuariosAtivos: number;
  jogosHoje: number;
  palpitesHoje: number;
  novosUsuariosHoje: number;
}

export interface JogoDestaque {
  _id: string;
  timeCasa: string;
  timeVisitante: string;
  placarCasa?: number;
  placarVisitante?: number;
  dataJogo: Date;
  status: string;
  totalPalpites: number;
  campeonato: string;
}

export interface PalpiteRecente {
  _id: string;
  usuario: {
    nome: string;
    bairro?: string;
  };
  jogo: {
    timeCasa: string;
    timeVisitante: string;
    dataJogo: Date;
  };
  palpite: {
    placarCasa: number;
    placarVisitante: number;
  };
  pontos?: number;
  createdAt: Date;
}

export interface AtividadeRecente {
  tipo: 'user' | 'game' | 'bet' | 'admin';
  titulo: string;
  descricao: string;
  timestamp: Date;
  usuario?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  // Estatísticas gerais do dashboard admin
  getAdminStats(): Observable<DashboardStats> {
    return this.http
      .get<any>(`${this.apiUrl}/admin/stats`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          // O backend retorna { success: true, data: {...} }
          if (response.data) {
            return response.data as DashboardStats;
          }
          // Fallback para formato direto
          return response as DashboardStats;
        })
      );
  }

  // Jogos em destaque
  getJogosDestaque(): Observable<JogoDestaque[]> {
    return this.http
      .get<any>(`${this.apiUrl}/jogos-destaque`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          // O backend retorna { success: true, data: [...] }
          if (response.data) {
            return Array.isArray(response.data) ? response.data : [];
          }
          // Fallback para formato direto
          return Array.isArray(response) ? response : [];
        })
      );
  }

  // Palpites recentes
  getPalpitesRecentes(limit: number = 10): Observable<PalpiteRecente[]> {
    return this.http
      .get<any>(`${this.apiUrl}/palpites-recentes?limit=${limit}`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          // O backend retorna { success: true, data: [...] }
          if (response.data) {
            return Array.isArray(response.data) ? response.data : [];
          }
          // Fallback para formato direto
          return Array.isArray(response) ? response : [];
        })
      );
  }

  // Atividades recentes para admin
  getAtividadesRecentes(limit: number = 10): Observable<AtividadeRecente[]> {
    return this.http
      .get<any>(`${this.apiUrl}/admin/atividades?limit=${limit}`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          // O backend retorna { success: true, data: [...] }
          if (response.data) {
            return Array.isArray(response.data) ? response.data : [];
          }
          // Fallback para formato direto
          return Array.isArray(response) ? response : [];
        })
      );
  }

  // Dados para gráficos
  getChartData(
    tipo: 'usuarios' | 'palpites' | 'jogos',
    periodo: 'semana' | 'mes' | 'trimestre' = 'mes'
  ): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/admin/charts/${tipo}?periodo=${periodo}`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          // O backend retorna { success: true, data: {...} }
          if (response.data) {
            return response.data;
          }
          // Fallback para formato direto
          return response;
        })
      );
  }
}
