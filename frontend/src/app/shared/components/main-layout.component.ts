import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { AuthService } from '../../modules/auth/services/auth.service';
import { User } from '../schemas/user.schema';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, RippleModule],
  template: `
    <!-- PWA MOBILE LAYOUT - TENDÊNCIAS 2025 -->
    <div class="pwa-layout">
      <!-- Safe Area Top -->
      <div class="pwa-layout__safe-top"></div>

      <!-- Main Content Container -->
      <div class="pwa-layout__container">
        <!-- Content Screen -->
        <div
          class="pwa-layout__screen"
          [class.pwa-layout__screen--slide-left]="slideDirection === 'left'"
          [class.pwa-layout__screen--slide-right]="slideDirection === 'right'"
        >
          <div class="pwa-layout__content">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>

      <!-- Floating Bottom Navigation -->
      <div class="pwa-layout__nav-wrapper">
        <nav class="pwa-layout__nav">
          <button
            *ngFor="let item of menuItems"
            class="pwa-layout__nav-btn"
            [class.pwa-layout__nav-btn--active]="isActiveRoute(item.routerLink)"
            (click)="navigateWithSlide(item.routerLink!)"
            pRipple
          >
            <div class="pwa-layout__nav-icon">
              <i [class]="item.icon"></i>
            </div>
            <span class="pwa-layout__nav-label">{{ item.label }}</span>
          </button>
        </nav>
      </div>

      <!-- Safe Area Bottom -->
      <div class="pwa-layout__safe-bottom"></div>
    </div>
  `,
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  user: User | null = null;
  slideDirection: 'left' | 'right' | null = null;
  previousRoute = '';

  menuItems: MenuItem[] = [
    {
      icon: 'pi pi-calendar',
      label: 'Jogos',
      routerLink: '/jogos',
    },
    {
      icon: 'pi pi-trophy',
      label: 'Ranking',
      routerLink: '/ranking',
    },
    {
      icon: 'pi pi-cog',
      label: 'Configurações',
      routerLink: '/configuracoes',
    },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });

    this.previousRoute = this.router.url;
  }

  navigateWithSlide(route: string): void {
    if (route === this.router.url) return;

    // Determinar direção do slide baseado na ordem dos menus
    const currentIndex = this.menuItems.findIndex((item) => item.routerLink === this.router.url);
    const targetIndex = this.menuItems.findIndex((item) => item.routerLink === route);

    this.slideDirection = targetIndex > currentIndex ? 'left' : 'right';

    // Executar navegação com animação
    setTimeout(() => {
      this.router.navigate([route]);

      // Reset animação após navegação
      setTimeout(() => {
        this.slideDirection = null;
      }, 300);
    }, 50);
  }

  isActiveRoute(route: string | undefined): boolean {
    if (!route) return false;
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
