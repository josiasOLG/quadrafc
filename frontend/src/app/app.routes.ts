import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { initialGuard } from './core/guards/initial.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { MainLayoutComponent } from './shared/components/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [initialGuard],
    children: [],
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then((m) => m.AuthModule),
    canActivate: [noAuthGuard],
  },
  {
    path: 'onboarding',
    loadChildren: () =>
      import('./modules/onboarding/onboarding.module').then((m) => m.OnboardingModule),
    canActivate: [authGuard],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'jogos',
        loadChildren: () => import('./modules/jogos/jogos.module').then((m) => m.JogosModule),
      },
      {
        path: 'ranking',
        loadChildren: () => import('./modules/ranking/ranking.module').then((m) => m.RankingModule),
      },
      {
        path: 'configuracoes',
        loadChildren: () =>
          import('./modules/configuracoes/configuracoes.module').then((m) => m.ConfiguracoesModule),
      },
      {
        path: 'loja',
        loadChildren: () => import('./modules/loja/loja.module').then((m) => m.LojaModule),
      },
      {
        path: 'premium-store',
        loadComponent: () =>
          import('./modules/premium/components/premium-store/premium-store.component').then(
            (m) => m.PremiumStoreComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/jogos',
  },
];
