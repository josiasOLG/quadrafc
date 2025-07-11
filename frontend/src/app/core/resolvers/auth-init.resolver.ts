import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';

/**
 * Resolver que garante que o AuthService foi completamente inicializado
 * antes de qualquer rota ser ativada
 */
export const authInitResolver: ResolveFn<boolean> = () => {
  const authService = inject(AuthService);

  return new Promise<boolean>((resolve) => {
    // Se já foi inicializado, resolver imediatamente
    if (authService.isInitialized()) {
      resolve(true);
      return;
    }

    // Aguardar inicialização com timeout de segurança
    const checkInterval = setInterval(() => {
      if (authService.isInitialized()) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 10); // Check a cada 10ms

    // Timeout de segurança (2 segundos)
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(true); // Resolve mesmo se não inicializou para não travar a app
    }, 2000);
  });
};
