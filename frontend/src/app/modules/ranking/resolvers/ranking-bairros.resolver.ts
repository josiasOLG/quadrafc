import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { User } from '../../../shared/schemas/user.schema';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { RankingService } from '../services/ranking.service';

interface LocalRankingBairro {
  posicao: number;
  bairro: {
    id?: string;
    nome: string;
    cidade: string;
    estado: string;
    cep?: string;
  };
  pontos_totais: number;
  usuarios_ativos: number;
  media_pontuacao: number;
}

export interface RankingBairrosResolverData {
  rankingBairros: LocalRankingBairro[];
  user: User | null;
  campeonatoNome: string | null;
  hasError: boolean;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RankingBairrosResolver implements Resolve<RankingBairrosResolverData> {
  constructor(
    private rankingService: RankingService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<RankingBairrosResolverData> {
    const currentUser = this.authService.currentUser();
    const campeonatoNome = route.queryParams['campeonatoNome'] || null;

    if (!currentUser?.cidade || !currentUser?.estado) {
      return of({
        rankingBairros: [],
        user: currentUser,
        campeonatoNome,
        hasError: true,
        errorMessage: 'Configure sua localização para ver o ranking',
      });
    }

    return this.rankingService
      .getRankingBairrosCidade(
        currentUser.cidade,
        currentUser.estado,
        {
          limit: 50,
          page: 1,
        },
        campeonatoNome
      )
      .pipe(
        map((response: any) => {
          const rankingBairros = this.processRankingData(response, currentUser);
          return {
            rankingBairros,
            user: currentUser,
            campeonatoNome,
            hasError: false,
          };
        }),
        catchError(() => {
          this.toastService.error('Erro ao carregar ranking de bairros');
          return of({
            rankingBairros: [],
            user: currentUser,
            campeonatoNome,
            hasError: true,
            errorMessage: 'Erro ao carregar ranking de bairros',
          });
        })
      );
  }

  private processRankingData(response: any, user: User): LocalRankingBairro[] {
    if (!response?.data) {
      return [];
    }

    return response.data.map((item: any, index: number) => ({
      posicao: index + 1,
      bairro: {
        nome: item.bairro || item.nome || item._id,
        cidade: item.cidade || user.cidade || '',
        estado: item.estado || user.estado || '',
      },
      pontos_totais: item.pontos_totais || item.totalPoints || item.pontos || 0,
      usuarios_ativos: item.usuarios_ativos || item.totalUsuarios || item.usuarios || 0,
      media_pontuacao: item.media_pontuacao || item.pontuacaoMedia || item.mediaPoints || 0,
    }));
  }
}
