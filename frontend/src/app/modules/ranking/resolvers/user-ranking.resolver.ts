import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { User } from '../../../shared/schemas/user.schema';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { RankingService } from '../services/ranking.service';

interface RankingUsuario {
  posicao: number;
  user: {
    id?: string;
    nome: string;
    avatar?: string;
    email: string;
    bairro: string;
  };
  pontos_totais: number;
  palpites_corretos: number;
  palpites_totais: number;
  percentual_acerto: number;
}

export interface UserRankingResolverData {
  podioUsuarios: RankingUsuario[];
  outrosUsuarios: RankingUsuario[];
  rankingUsuarios: RankingUsuario[];
  user: User | null;
  campeonatoNome: string | null;
  bairroSelecionado: string | null;
  hasError: boolean;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserRankingResolver implements Resolve<UserRankingResolverData> {
  constructor(
    private rankingService: RankingService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<UserRankingResolverData> {
    const currentUser = this.authService.currentUser();
    const campeonatoNome = route.queryParams['campeonatoNome'] || null;

    if (!currentUser?.cidade || !currentUser?.estado) {
      return of({
        podioUsuarios: [],
        outrosUsuarios: [],
        rankingUsuarios: [],
        user: currentUser,
        campeonatoNome,
        bairroSelecionado: null,
        hasError: true,
        errorMessage: 'Configure sua localização para ver o ranking de usuários',
      });
    }

    return this.rankingService
      .getTopUsuariosPorBairro(currentUser.cidade, currentUser.estado, campeonatoNome)
      .pipe(
        map((response: any) => {
          const { podioUsuarios, outrosUsuarios } = this.processUserRankingData(response);
          return {
            podioUsuarios,
            outrosUsuarios,
            rankingUsuarios: [...podioUsuarios, ...outrosUsuarios],
            user: currentUser,
            campeonatoNome,
            bairroSelecionado: currentUser.bairro || null,
            hasError: false,
          };
        }),
        catchError(() => {
          this.toastService.error('Erro ao carregar ranking de usuários');
          return of({
            podioUsuarios: [],
            outrosUsuarios: [],
            rankingUsuarios: [],
            user: currentUser,
            campeonatoNome,
            bairroSelecionado: currentUser?.bairro || null,
            hasError: true,
            errorMessage: 'Erro ao carregar ranking de usuários',
          });
        })
      );
  }

  private processUserRankingData(response: any): {
    podioUsuarios: RankingUsuario[];
    outrosUsuarios: RankingUsuario[];
  } {
    if (!response?.podio && !response?.outros) {
      return { podioUsuarios: [], outrosUsuarios: [] };
    }

    const podioUsuarios = this.convertUsuariosArray(response.podio || []);
    const outrosUsuarios = this.convertUsuariosArray(response.outros || []);

    return { podioUsuarios, outrosUsuarios };
  }

  private convertUsuariosArray(usuarios: any[]): RankingUsuario[] {
    return usuarios.map((usuario: any, index: number) => ({
      posicao: usuario.posicao || index + 1,
      user: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email || '',
        avatar: usuario.avatarUrl || usuario.avatar || '',
        bairro: usuario.bairro || '',
      },
      pontos_totais: usuario.totalPoints || usuario.pontos || 0,
      palpites_corretos: usuario.palpites_corretos || 0,
      palpites_totais: usuario.total_palpites || 0,
      percentual_acerto: usuario.taxa_acerto || 0,
    }));
  }
}
