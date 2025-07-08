import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../modules/auth/services/auth.service';
import { User } from '../schemas/user.schema';
import { UserHeaderComponent } from './user-header/user-header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, UserHeaderComponent],
  template: `
    <!-- LAYOUT PRINCIPAL COM HEADER FIXO E BOTTOM NAV -->
    <div class="main-layout">
      <!-- Header Fixo com Stats do Usuário -->
      <div class="main-layout__header">
        <app-user-header [user]="user"></app-user-header>
      </div>

      <!-- Conteúdo Principal (Router Outlet) -->
      <div class="main-layout__content">
        <router-outlet></router-outlet>
      </div>

      <!-- Bottom Navigation Customizado -->
      <div class="main-layout__bottom-nav">
        <button
          *ngFor="let item of menuItems"
          class="main-layout__nav-button"
          [class.main-layout__nav-button--active]="isActiveRoute(item.routerLink)"
          (click)="navigateTo(item.routerLink)"
        >
          <i [class]="item.icon" class="main-layout__nav-icon"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  user: User | null = null;

  menuItems: MenuItem[] = [
    {
      icon: 'pi pi-calendar',
      routerLink: '/jogos',
      command: () => this.navigateTo('/jogos'),
    },
    {
      icon: 'pi pi-trophy',
      routerLink: '/ranking',
      command: () => this.navigateTo('/ranking'),
    },
    {
      icon: 'pi pi-cog',
      routerLink: '/configuracoes',
      command: () => this.navigateTo('/configuracoes'),
    },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
  }

  getUserPoints(): number {
    return this.user?.pontos_totais || this.user?.totalPoints || 0;
  }

  getUserCoins(): number {
    return this.user?.moedas || 0;
  }

  getUserStreak(): number {
    return this.user?.estatisticas?.sequencia_atual || 0;
  }

  getUserLevel(): number {
    return this.user?.nivel || 1;
  }

  getBairroInfo(): string {
    if (this.user?.bairro && this.user?.cidade && this.user?.estado) {
      const bairro = {
        nome: this.user.bairro,
        cidade: this.user.cidade,
        estado: this.user.estado,
      };
      return `${bairro.nome}, ${bairro.cidade} - ${bairro.estado}`;
    }
    return this.user?.bairro || 'Selecione seu bairro';
  }

  getLevelProgress(): number {
    const points = this.getUserPoints();
    const currentLevelPoints = (this.getUserLevel() - 1) * 1000;
    const nextLevelPoints = this.getUserLevel() * 1000;
    const progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  navigateTo(route: string | undefined): void {
    if (route) {
      this.router.navigate([route]);
    }
  }

  isActiveRoute(route: string | undefined): boolean {
    if (!route) return false;
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
