import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { from } from 'rxjs';
import { AuthService } from '../../modules/auth/services/auth.service';

export const authInitResolver: ResolveFn<boolean> = () => {
  const authService = inject(AuthService);

  return from(
    new Promise<boolean>((resolve) => {
      if (authService.isInitialized()) {
        resolve(true);
        return;
      }

      const checkInterval = setInterval(() => {
        if (authService.isInitialized()) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 10);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(true);
      }, 2000);
    })
  );
};
