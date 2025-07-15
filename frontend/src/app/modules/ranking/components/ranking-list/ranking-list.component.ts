import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { UserMiniHeaderComponent } from '../../../../shared/components/user-mini-header/user-mini-header.component';
import { User } from '../../../../shared/schemas/user.schema';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RankingBairrosResolverData } from '../../resolvers/ranking-bairros.resolver';
import { UserRankingResolverData } from '../../resolvers/user-ranking.resolver';
import { UserRankingComponent } from '../user-ranking/user-ranking.component';

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

@Component({
  selector: 'app-ranking-list',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    BadgeModule,
    ButtonModule,
    SkeletonModule,
    TagModule,
    TooltipModule,
    UserMiniHeaderComponent,
    UserRankingComponent,
  ],
  templateUrl: './ranking-list.component.html',
  styleUrls: ['./ranking-list.component.scss'],
})
export class RankingListComponent implements OnInit {
  user: User | null = null;
  rankingBairros: LocalRankingBairro[] = [];
  isLoading = true;

  // Tab system
  activeTab: 'bairros' | 'usuarios' = 'bairros';
  selectedBairroForUserRanking: LocalRankingBairro | null = null;

  // Parâmetros do campeonato
  campeonatoNome: string | null = null;

  // Dados do user ranking para repassar ao componente filho
  userRankingData: UserRankingResolverData | null = null;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadDataFromResolver();
  }
  /**
   * Carrega dados do resolver
   */
  private loadDataFromResolver(): void {
    const resolverData = this.route.snapshot.data['rankingData'] as RankingBairrosResolverData;
    const userRankingData = this.route.snapshot.data['userRankingData'] as UserRankingResolverData;

    if (resolverData.hasError) {
      this.isLoading = false;
      if (resolverData.errorMessage) {
        this.toastService.warn(resolverData.errorMessage);
      }
      return;
    }

    this.user = resolverData.user;
    this.rankingBairros = resolverData.rankingBairros;
    this.campeonatoNome = resolverData.campeonatoNome;
    this.userRankingData = userRankingData;
    this.isLoading = false;

    // Escutar mudanças nos queryParams para recarregar quando necessário
    this.route.queryParams.subscribe((params) => {
      const newCampeonatoNome = params['campeonatoNome'] || null;

      // Se o campeonato mudou, recarregar a página para acionar o resolver novamente
      if (newCampeonatoNome !== this.campeonatoNome) {
        window.location.reload();
      }
    });
  }

  /**
   * Track by function para otimizar renderização de bairros
   */
  trackByBairro(index: number, item: LocalRankingBairro): string {
    return `${item.bairro.nome}-${item.bairro.cidade}-${item.posicao}`;
  }

  /**
   * Abre o ranking de usuários de um bairro
   */
  openUserRankingForBairro(bairro: LocalRankingBairro): void {
    this.selectedBairroForUserRanking = bairro;
    this.activeTab = 'usuarios';
  }

  /**
   * Define a tab ativa
   */
  setActiveTab(tab: 'bairros' | 'usuarios'): void {
    this.activeTab = tab;

    // Se a tab de usuários for selecionada e não há bairro selecionado,
    // seleciona automaticamente o primeiro bairro do ranking
    if (
      tab === 'usuarios' &&
      !this.selectedBairroForUserRanking &&
      this.rankingBairros.length > 0
    ) {
      this.selectedBairroForUserRanking = this.rankingBairros[0];
    }
  }

  /**
   * Retorna classe CSS para badge de ranking
   */
  getRankingBadgeClass(posicao: number): string {
    if (posicao === 1) return 'ranking-badge--first';
    if (posicao === 2) return 'ranking-badge--second';
    if (posicao === 3) return 'ranking-badge--third';
    if (posicao <= 10) return 'ranking-badge--top10';
    return 'ranking-badge--default';
  }

  /**
   * Retorna ícone e cor da medalha baseado na posição
   */
  getBairroMedalha(posicao: number): { icon: string; color: string } | null {
    switch (posicao) {
      case 1:
        return { icon: 'pi-crown', color: '#FFD700' };
      case 2:
        return { icon: 'pi-star', color: '#C0C0C0' };
      case 3:
        return { icon: 'pi-trophy', color: '#CD7F32' };
      default:
        return null;
    }
  }

  /**
   * Formata número com separadores de milhares
   */
  formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) {
      return '0';
    }
    return new Intl.NumberFormat('pt-BR').format(num);
  }

  /**
   * Formata percentual com 1 casa decimal
   */
  formatPercentage(num: number): string {
    return `${num.toFixed(1)}%`;
  }
}
