import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { map, filter, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se não está carregando, verifica imediatamente
  if (!authService.isLoading) {
    const user = authService.currentUser;

    if (user) {
      if (authService.needsOnboarding) {
        router.navigate(['/onboarding']);
      } else {
        router.navigate(['/jogos']);
      }
      return false;
    }

    return true;
  }

  // Se está carregando, aguarda terminar
  return combineLatest([
    authService.currentUser$,
    authService.loading$
  ]).pipe(
    filter(([user, loading]) => !loading),
    take(1),
    map(([user]) => {
      if (user) {
        if (authService.needsOnboarding) {
          router.navigate(['/onboarding']);
        } else {
          router.navigate(['/jogos']);
        }
        return false;
      }

      return true;
    })
  );
};
