import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../../modules/auth/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se não está carregando, verifica imediatamente
  if (!authService.isLoading) {
    const user = authService.currentUser;

    if (!user) {
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    // Se já tem bairroId, nunca deixa acessar onboarding nem redireciona para onboarding
    if (user.bairroId) {
      if (state.url !== '/ranking') {
        router.navigate(['/ranking']);
        return false;
      }
      return true;
    }
    // Se precisa de onboarding e não está na rota de onboarding, redireciona para onboarding
    if (authService.needsOnboarding && !state.url.includes('/onboarding')) {
      router.navigate(['/onboarding']);
      return false;
    }
    // Se está tentando acessar onboarding, mas não precisa, bloqueia
    if (!authService.needsOnboarding && state.url.includes('/onboarding')) {
      router.navigate(['/ranking']);
      return false;
    }
    return true;
  }

  // Se está carregando, aguarda terminar
  return combineLatest([authService.currentUser$, authService.loading$]).pipe(
    filter(([, loading]) => !loading),
    take(1),
    map(([user]) => {
      if (!user) {
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url },
        });
        return false;
      }

      // Se já tem bairroId, nunca deixa acessar onboarding nem redireciona para onboarding
      if (user.bairroId) {
        if (state.url !== '/ranking') {
          router.navigate(['/ranking']);
          return false;
        }
        return true;
      }
      // Se precisa de onboarding e não está na rota de onboarding, redireciona para onboarding
      if (authService.needsOnboarding && !state.url.includes('/onboarding')) {
        router.navigate(['/onboarding']);
        return false;
      }
      // Se está tentando acessar onboarding, mas não precisa, bloqueia
      if (!authService.needsOnboarding && state.url.includes('/onboarding')) {
        router.navigate(['/ranking']);
        return false;
      }
      return true;
    })
  );
};
