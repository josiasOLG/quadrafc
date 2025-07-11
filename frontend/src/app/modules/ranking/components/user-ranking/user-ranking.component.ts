import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

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
import { RankingService } from '../../services/ranking.service';

interface RankingUsuario {
  posicao: number;
  user: {
    id?: string;
    nome: string;
    avatar?: string;
    email: string;
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
    private rankingService: RankingService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Primeiro, carregar o usuário atual
    this.loadCurrentUser();

    // Se já temos um bairro selecionado, carregar ranking imediatamente
    if (this.selectedBairro) {
      this.loadUserRanking();
    }
  }

  private loadCurrentUser() {
    this.authService.currentUser$.subscribe({
      next: (user: User | null) => {
        this.user = user;
        // Após carregar o usuário, verificamos se devemos iniciar o carregamento do ranking
        if (user && (!this.selectedBairro || !this.rankingUsuarios.length)) {
          // Carregar ranking com os dados do usuário logado
          this.loadUserRankingFromUserData();
        }
      },
      error: (error: any) => {},
    });
  }

  // Novo método para carregar o ranking a partir dos dados do usuário logado
  private loadUserRankingFromUserData() {
    if (!this.user || !this.user.cidade || !this.user.estado) {
      console.warn('⚠️ Dados do usuário incompletos para carregar ranking');
      return;
    }

    this.isLoading = true;
    this.bairroSelecionado = this.user.bairro || null;

    // Usando o endpoint com os dados do usuário logado
    this.rankingService.getTopUsuariosPorBairro(this.user.cidade, this.user.estado).subscribe({
      next: (response) => {
        this.processRankingResponse(response);
      },
      error: (error) => {
        this.handleRankingError(error);
      },
    });
  }

  loadUserRanking() {
    if (!this.selectedBairro) {
      // Se não há bairro selecionado e temos um usuário, usar dados do usuário
      if (this.user) {
        this.loadUserRankingFromUserData();
      }
      return;
    }

    this.isLoading = true;
    this.bairroSelecionado = this.selectedBairro.bairro.nome;

    // Usando o novo endpoint para obter os top 5 usuários por bairro
    this.rankingService
      .getTopUsuariosPorBairro(this.selectedBairro.bairro.cidade, this.selectedBairro.bairro.estado)
      .subscribe({
        next: (response) => {
          this.processRankingResponse(response);
        },
        error: (error) => {
          this.handleRankingError(error);
        },
      });
  }

  // Método auxiliar para processar a resposta do ranking
  private processRankingResponse(response: any) {
    if (response?.podio && response?.outros) {
      this.podioUsuarios = this.convertUsuariosArray(response.podio);
      this.outrosUsuarios = this.convertUsuariosArray(response.outros);

      this.rankingUsuarios = [...this.podioUsuarios, ...this.outrosUsuarios];
    } else {
      this.resetRankingData();
      this.toastService.error('Erro ao processar dados do ranking');
    }

    this.isLoading = false;
  }

  // Método auxiliar para converter array de usuários para o formato do componente
  private convertUsuariosArray(usuarios: any[]): RankingUsuario[] {
    return usuarios.map((usuario: any, index: number) => ({
      posicao: usuario.posicao || index + 1,
      user: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email || '',
        avatar: usuario.avatarUrl || usuario.avatar || '',
      },
      pontos_totais: usuario.totalPoints || usuario.pontos || 0,
      palpites_corretos: usuario.palpites_corretos || 0,
      palpites_totais: usuario.total_palpites || 0,
      percentual_acerto: usuario.taxa_acerto || 0,
    }));
  }

  // Método auxiliar para resetar dados do ranking
  private resetRankingData() {
    this.rankingUsuarios = [];
    this.podioUsuarios = [];
    this.outrosUsuarios = [];
  }

  // Método auxiliar para lidar com erros
  private handleRankingError(error: any) {
    this.resetRankingData();
    this.isLoading = false;
    this.toastService.error('Erro ao carregar ranking de usuários');
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
