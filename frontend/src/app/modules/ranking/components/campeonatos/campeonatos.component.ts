import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { UserMiniHeaderComponent } from '../../../../shared/components/user-mini-header/user-mini-header.component';
import { User } from '../../../../shared/schemas/user.schema';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CampeonatoResumo, RankingService } from '../../services/ranking.service';

@Component({
  selector: 'app-campeonatos',
  standalone: true,
  imports: [
    CommonModule,
    AvatarModule,
    ButtonModule,
    CardModule,
    SkeletonModule,
    TagModule,
    TooltipModule,
    UserMiniHeaderComponent,
  ],
  templateUrl: './campeonatos.component.html',
  styleUrl: './campeonatos.component.scss',
})
export class CampeonatosComponent implements OnInit {
  user: User | null = null;
  campeonatos: CampeonatoResumo[] = [];
  loading = true;
  mesAtual = '';

  private readonly USER_COOKIE_KEY = 'quadrafc_user';

  constructor(
    private rankingService: RankingService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.definirMesAtual();
    this.loadUserFromCookie();
    this.loadUser();
    this.carregarCampeonatos();
  }

  private definirMesAtual(): void {
    const agora = new Date();
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    this.mesAtual = `${meses[agora.getMonth()]} ${agora.getFullYear()}`;
  }

  private carregarCampeonatos(): void {
    this.loading = true;
    this.rankingService.getCampeonatosMesAtual().subscribe({
      next: (campeonatos) => {
        this.campeonatos = campeonatos;
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Erro ao carregar campeonatos. Tente novamente.');
        this.loading = false;
      },
    });
  }

  private loadUserFromCookie(): void {
    try {
      const userCookie = this.getCookie(this.USER_COOKIE_KEY);
      if (userCookie) {
        const userData = JSON.parse(decodeURIComponent(userCookie));
        this.user = userData;
      }
    } catch {
      // Silently handle cookie parsing errors
    }
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private loadUser(): void {
    this.authService.currentUser$.subscribe({
      next: (user: User | null) => {
        if (user) {
          this.user = user;
        }
      },
      error: () => {
        // Handle error silently
      },
    });
  }

  getSeverityByStatus(
    status: string
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'em_andamento':
        return 'success';
      case 'finalizado':
        return 'info';
      case 'agendado':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'em_andamento':
        return 'Em Andamento';
      case 'finalizado':
        return 'Finalizado';
      case 'agendado':
        return 'Agendado';
      default:
        return 'Indefinido';
    }
  }

  formatarData(data: Date): string {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  onRefresh(): void {
    this.carregarCampeonatos();
  }

  trackByCampeonato(index: number, campeonato: CampeonatoResumo): string {
    return campeonato.id;
  }
}
