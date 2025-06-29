import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { map, filter, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export const initialGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se não está carregando, verifica imediatamente
  if (!authService.isLoading) {
    const user = authService.currentUser;

    if (!user) {
      // Não está logado - vai para login
      router.navigate(['/auth/login']);
      return false;
    }

    if (authService.needsOnboarding) {
      // Precisa de onboarding
      router.navigate(['/onboarding']);
      return false;
    }

    // Está logado e completo - vai para jogos
    router.navigate(['/jogos']);
    return false;
  }

  // Se está carregando, aguarda terminar
  return combineLatest([
    authService.currentUser$,
    authService.loading$
  ]).pipe(
    filter(([user, loading]) => !loading),
    take(1),
    map(([user]) => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }

      if (authService.needsOnboarding) {
        router.navigate(['/onboarding']);
        return false;
      }

      router.navigate(['/jogos']);
      return false;
    })
  );
};
