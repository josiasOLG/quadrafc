import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MenubarModule,
    SidebarModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  sidebarVisible = false;

  constructor(private authService: AuthService) {}

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
    },
    {
      label: 'Usuários',
      icon: 'pi pi-users',
      routerLink: '/users',
    },
    {
      label: 'Jogos',
      icon: 'pi pi-trophy',
      routerLink: '/jogos',
    },
    {
      label: 'Palpites',
      icon: 'pi pi-star',
      routerLink: '/palpites',
    },
    {
      label: 'Ranking',
      icon: 'pi pi-chart-line',
      routerLink: '/ranking',
    },
  ];

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {},
      error: (error) => {},
    });
  }
}
