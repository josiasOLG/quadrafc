import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { User } from '../../../shared/models/user.model';
import { UserService } from '../../../shared/services/user.service';

interface UserPalpite {
  _id: string;
  jogo: {
    timeCasa: string;
    timeVisitante: string;
    dataJogo: Date;
    campeonato: string;
  };
  palpite: {
    placarCasa: number;
    placarVisitante: number;
  };
  pontos?: number;
  acertou?: boolean;
  createdAt: Date;
}

interface UserRanking {
  posicao: number;
  tipo: 'bairro' | 'cidade' | 'estado' | 'nacional';
  totalUsuarios: number;
  pontos: number;
}

interface UserTransacao {
  _id: string;
  tipo: 'ganho' | 'gasto' | 'bonus' | 'premium';
  valor: number;
  descricao: string;
  createdAt: Date;
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    TabViewModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    ChipModule,
    AvatarModule,
    SkeletonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  loading = true;
  userId: string;

  // Dados das abas
  palpites: UserPalpite[] = [];
  rankings: UserRanking[] = [];
  transacoes: UserTransacao[] = [];

  // Estados de carregamento das abas
  loadingPalpites = false;
  loadingRankings = false;
  loadingTransacoes = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private messageService: MessageService
  ) {
    this.userId = this.route.snapshot.params['id'];
  }

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    this.loading = true;

    this.userService.getById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar usuário:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados do usuário',
        });
        this.loading = false;
      },
    });
  }

  loadPalpites() {
    if (this.palpites.length > 0) return; // Já carregou

    this.loadingPalpites = true;

    // Simular dados - substituir por chamada real ao backend
    setTimeout(() => {
      this.palpites = [
        {
          _id: '1',
          jogo: {
            timeCasa: 'Flamengo',
            timeVisitante: 'Vasco',
            dataJogo: new Date(),
            campeonato: 'Campeonato Carioca',
          },
          palpite: {
            placarCasa: 2,
            placarVisitante: 1,
          },
          pontos: 5,
          acertou: true,
          createdAt: new Date(),
        },
        {
          _id: '2',
          jogo: {
            timeCasa: 'Palmeiras',
            timeVisitante: 'Corinthians',
            dataJogo: new Date(Date.now() - 86400000),
            campeonato: 'Campeonato Paulista',
          },
          palpite: {
            placarCasa: 1,
            placarVisitante: 0,
          },
          pontos: 0,
          acertou: false,
          createdAt: new Date(Date.now() - 86400000),
        },
      ];
      this.loadingPalpites = false;
    }, 1000);
  }

  loadRankings() {
    if (this.rankings.length > 0) return; // Já carregou

    this.loadingRankings = true;

    // Simular dados - substituir por chamada real ao backend
    setTimeout(() => {
      this.rankings = [
        {
          posicao: 15,
          tipo: 'bairro',
          totalUsuarios: 250,
          pontos: this.user?.totalPontos || 0,
        },
        {
          posicao: 45,
          tipo: 'cidade',
          totalUsuarios: 1200,
          pontos: this.user?.totalPontos || 0,
        },
        {
          posicao: 180,
          tipo: 'estado',
          totalUsuarios: 5600,
          pontos: this.user?.totalPontos || 0,
        },
        {
          posicao: 850,
          tipo: 'nacional',
          totalUsuarios: 15000,
          pontos: this.user?.totalPontos || 0,
        },
      ];
      this.loadingRankings = false;
    }, 1000);
  }

  loadTransacoes() {
    if (this.transacoes.length > 0) return; // Já carregou

    this.loadingTransacoes = true;

    // Simular dados - substituir por chamada real ao backend
    setTimeout(() => {
      this.transacoes = [
        {
          _id: '1',
          tipo: 'ganho',
          valor: 50,
          descricao: 'Palpite certeiro - Flamengo vs Vasco',
          createdAt: new Date(),
        },
        {
          _id: '2',
          tipo: 'gasto',
          valor: -20,
          descricao: 'Compra de acesso - Ranking Estadual',
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          _id: '3',
          tipo: 'bonus',
          valor: 100,
          descricao: 'Bônus de cadastro',
          createdAt: new Date(Date.now() - 86400000),
        },
      ];
      this.loadingTransacoes = false;
    }, 1000);
  }

  onTabChange(event: any) {
    const index = event.index;

    switch (index) {
      case 1: // Palpites
        this.loadPalpites();
        break;
      case 2: // Rankings
        this.loadRankings();
        break;
      case 3: // Transações
        this.loadTransacoes();
        break;
    }
  }

  toggleUserStatus() {
    if (!this.user) return;

    const newStatus = !this.user.ativo;

    this.userService.toggleStatus(this.user.id!, newStatus).subscribe({
      next: () => {
        this.user!.ativo = newStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
        });
      },
      error: (error) => {
        console.error('Erro ao alterar status:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao alterar status do usuário',
        });
      },
    });
  }

  editUser() {
    this.router.navigate(['/users/edit', this.userId]);
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  getStatusSeverity(ativo: boolean): 'success' | 'danger' {
    return ativo ? 'success' : 'danger';
  }

  getPremiumStatusSeverity(premium: boolean): 'success' | 'secondary' {
    return premium ? 'success' : 'secondary';
  }

  getPalpiteSeverity(acertou?: boolean): 'success' | 'danger' | 'secondary' {
    if (acertou === undefined) return 'secondary';
    return acertou ? 'success' : 'danger';
  }

  getTransacaoSeverity(tipo: string): 'success' | 'danger' | 'info' | 'warning' {
    switch (tipo) {
      case 'ganho':
      case 'bonus':
        return 'success';
      case 'gasto':
        return 'danger';
      case 'premium':
        return 'warning';
      default:
        return 'info';
    }
  }

  getRankingColor(posicao: number): string {
    if (posicao <= 3) return '#ffd700'; // Ouro
    if (posicao <= 10) return '#c0c0c0'; // Prata
    if (posicao <= 50) return '#cd7f32'; // Bronze
    return '#6c757d'; // Padrão
  }
}
