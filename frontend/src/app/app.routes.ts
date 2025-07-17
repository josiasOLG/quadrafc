import { Routes } from '@angular/router';
import {
  authCanMatchGuard,
  noAuthCanMatchGuard,
  onboardingCanMatchGuard,
} from './core/guards/modern.guards';
import { MainLayoutComponent } from './shared/components/main-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    canMatch: [noAuthCanMatchGuard],
    loadChildren: () => import('./modules/auth/auth.module').then((m) => m.AuthModule),
    data: { preload: false }, // Não precarregar no SSR
  },
  {
    path: 'onboarding',
    canMatch: [onboardingCanMatchGuard],
    loadChildren: () =>
      import('./modules/onboarding/onboarding.module').then((m) => m.OnboardingModule),
    data: { preload: false }, // Não precarregar no SSR
  },
  {
    path: '',
    component: MainLayoutComponent,
    canMatch: [authCanMatchGuard],
    children: [
      {
        path: '',
        redirectTo: 'jogos',
        pathMatch: 'full',
      },
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
      {
        path: 'entrar-bairro/compartilhar-link',
        loadChildren: () => import('./modules/bairros/bairros.module').then((m) => m.BairrosModule),
      },
    ],
  },

  {
    path: '**',
    redirectTo: '',
  },
];
