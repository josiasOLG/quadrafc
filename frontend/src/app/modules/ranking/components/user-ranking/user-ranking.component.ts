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
import { AuthService } from '../../../auth/services/auth.service';

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
  isLoading = false;
  showUserDetailsModal = false;
  selectedUserDetails: RankingUsuario | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadCurrentUser();
    if (this.selectedBairro) {
      this.loadUserRanking();
    }
  }

  private loadCurrentUser() {
    this.authService.currentUser$.subscribe({
      next: (user: User | null) => {
        this.user = user;
      },
      error: (error: any) => {
        console.error('Erro ao carregar usuário:', error);
      },
    });
  }

  loadUserRanking() {
    if (!this.selectedBairro) return;

    this.isLoading = true;
    // Simular dados por enquanto, até ter o endpoint real
    setTimeout(() => {
      this.rankingUsuarios = this.generateMockUserRanking();
      this.isLoading = false;
    }, 1000);
  }

  private generateMockUserRanking(): RankingUsuario[] {
    return [
      {
        posicao: 1,
        user: {
          id: '1',
          nome: 'João Silva',
          email: 'joao@email.com',
          avatar: '',
        },
        pontos_totais: 1250,
        palpites_corretos: 45,
        palpites_totais: 60,
        percentual_acerto: 75.0,
      },
      {
        posicao: 2,
        user: {
          id: '2',
          nome: 'Maria Santos',
          email: 'maria@email.com',
          avatar: '',
        },
        pontos_totais: 1180,
        palpites_corretos: 42,
        palpites_totais: 58,
        percentual_acerto: 72.4,
      },
      {
        posicao: 3,
        user: {
          id: '3',
          nome: 'Pedro Costa',
          email: 'pedro@email.com',
          avatar: '',
        },
        pontos_totais: 1050,
        palpites_corretos: 38,
        palpites_totais: 55,
        percentual_acerto: 69.1,
      },
      {
        posicao: 4,
        user: {
          id: '4',
          nome: 'Ana Lima',
          email: 'ana@email.com',
          avatar: '',
        },
        pontos_totais: 980,
        palpites_corretos: 35,
        palpites_totais: 52,
        percentual_acerto: 67.3,
      },
      {
        posicao: 5,
        user: {
          id: '5',
          nome: 'Carlos Oliveira',
          email: 'carlos@email.com',
          avatar: '',
        },
        pontos_totais: 920,
        palpites_corretos: 32,
        palpites_totais: 50,
        percentual_acerto: 64.0,
      },
    ];
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
