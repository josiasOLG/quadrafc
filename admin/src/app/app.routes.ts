import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AdminGuard, AuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./modules/users/user-list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'users/create',
        loadComponent: () =>
          import('./modules/users/user-form/user-form.component').then((m) => m.UserFormComponent),
      },
      {
        path: 'users/edit/:id',
        loadComponent: () =>
          import('./modules/users/user-form/user-form.component').then((m) => m.UserFormComponent),
      },
      {
        path: 'games',
        loadComponent: () =>
          import('./modules/games/game-list/game-list.component').then((m) => m.GameListComponent),
      },
      {
        path: 'games/new',
        loadComponent: () =>
          import('./modules/games/game-form/game-form.component').then((m) => m.GameFormComponent),
      },
      {
        path: 'games/create',
        redirectTo: 'games/new',
      },
      {
        path: 'games/:id/edit',
        loadComponent: () =>
          import('./modules/games/game-form/game-form.component').then((m) => m.GameFormComponent),
      },
      {
        path: 'games/:id',
        loadComponent: () =>
          import('./modules/games/game-detail/game-detail.component').then(
            (m) => m.GameDetailComponent
          ),
      },
      // Adicionar mais rotas conforme necessário
    ],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
