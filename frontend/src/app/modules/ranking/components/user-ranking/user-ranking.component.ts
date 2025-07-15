import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { User } from '../../../../shared/schemas/user.schema';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRankingResolverData } from '../../resolvers/user-ranking.resolver';

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

interface RankingBairro {
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
  selector: 'app-user-ranking',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    BadgeModule,
    ButtonModule,
    SkeletonModule,
    TagModule,
    DialogModule,
    TooltipModule,
  ],
  templateUrl: './user-ranking.component.html',
  styleUrls: ['./user-ranking.component.scss'],
})
export class UserRankingComponent implements OnInit {
  @Input() selectedBairro: RankingBairro | null = null;
  @Input() campeonatoNome: string | null = null;

  user: User | null = null;
  rankingUsuarios: RankingUsuario[] = [];
  podioUsuarios: RankingUsuario[] = [];
  outrosUsuarios: RankingUsuario[] = [];
  isLoading = false;
  showUserDetailsModal = false;
  selectedUserDetails: RankingUsuario | null = null;

  // Propriedades para componente
  bairroSelecionado: string | null = null;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadDataFromResolver();
  }

  /**
   * Carrega dados do resolver
   */
  private loadDataFromResolver(): void {
    const resolverData = this.route.snapshot.data['userRankingData'] as UserRankingResolverData;

    if (resolverData.hasError) {
      this.isLoading = false;
      if (resolverData.errorMessage) {
        this.toastService.warn(resolverData.errorMessage);
      }
      return;
    }

    this.user = resolverData.user;
    this.podioUsuarios = resolverData.podioUsuarios;
    this.outrosUsuarios = resolverData.outrosUsuarios;
    this.rankingUsuarios = resolverData.rankingUsuarios;
    this.bairroSelecionado = resolverData.bairroSelecionado;
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
   * Método para carregar ranking quando o bairro selecionado muda via @Input
   */
  loadUserRanking() {
    if (this.selectedBairro) {
      this.bairroSelecionado = this.selectedBairro.bairro.nome;
      // Como os dados já foram carregados pelo resolver, apenas atualizamos a exibição
      // Se precisar de dados específicos para o bairro selecionado, pode implementar aqui
    }
  }

  openUserDetailsModal(user: RankingUsuario) {
    this.selectedUserDetails = user;
    this.showUserDetailsModal = true;
  }

  closeUserDetailsModal() {
    this.showUserDetailsModal = false;
    this.selectedUserDetails = null;
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  trackByUser(index: number, item: RankingUsuario): any {
    return item.user.id || index;
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getUserAvatar(user: RankingUsuario): string {
    return user.user.avatar || '';
  }
}
