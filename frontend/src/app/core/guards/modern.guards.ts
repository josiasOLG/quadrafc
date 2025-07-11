import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';

/**
 * Função auxiliar para aguardar até que o AuthService esteja completamente inicializado
 * COM TIMEOUT para evitar bloqueios no SSR
 */
async function waitForAuthServiceReady(
  authService: AuthService,
  timeoutMs = 5000
): Promise<boolean> {
  try {
    // Criar uma Promise de timeout
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(true); // Em caso de timeout, assumir que está pronto
      }, timeoutMs);
    });

    // Aguardar a Promise interna do AuthService OU o timeout
    const readyPromise = authService.waitUntilReady().then(() => true);

    await Promise.race([readyPromise, timeoutPromise]);

    // Verificação adicional para garantir que o estado não é transitório
    const authState = authService.authState();
    return authState !== 'INITIAL' && authState !== 'LOADING';
  } catch {
    return true; // Em caso de erro, permitir que continue (fail-safe)
  }
}

/**
 * Guard moderno usando CanMatch com Promise - BLOQUEIA navegação até autenticação ser confirmada
 * Isso evita 100% o flicker porque o router não ativa nenhuma rota até a Promise resolver
 */
export const authCanMatchGuard: CanMatchFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isReady = await waitForAuthServiceReady(authService);

  if (!isReady) {
    router.navigate(['/auth/login']);
    return false;
  }

  const authState = authService.authState();

  if (authState === 'AUTHENTICATED' || authState === 'NEEDS_ONBOARDING') {
    return true;
  }

  // Só redireciona para login se explicitamente UNAUTHENTICATED
  if (authState === 'UNAUTHENTICATED') {
    router.navigate(['/auth/login']);
  }
  return false;
};

/**
 * Guard para rotas que só podem ser acessadas por usuários NÃO autenticados
 */
export const noAuthCanMatchGuard: CanMatchFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // AGUARDAR até que o AuthService esteja 100% inicializado
  const isReady = await waitForAuthServiceReady(authService);

  if (!isReady) {
    return true; // Em caso de timeout, permitir acesso à tela de login
  }

  const authState = authService.authState();

  // Só permite acesso se explicitamente UNAUTHENTICATED
  if (authState === 'UNAUTHENTICATED') {
    return true;
  }

  // Se usuário está autenticado, redirecionar baseado no estado
  if (authState === 'NEEDS_ONBOARDING') {
    router.navigate(['/onboarding']);
  } else {
    router.navigate(['/jogos']);
  }
  return false;
};

/**
 * Guard específico para onboarding
 */
export const onboardingCanMatchGuard: CanMatchFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // AGUARDAR até que o AuthService esteja 100% inicializado
  const isReady = await waitForAuthServiceReady(authService);

  if (!isReady) {
    router.navigate(['/auth/login']);
    return false;
  }

  const authState = authService.authState();

  // Só permite acesso se usuário precisa de onboarding
  if (authState === 'NEEDS_ONBOARDING') {
    return true;
  }

  // Se usuário está completamente autenticado, redirecionar para jogos
  if (authState === 'AUTHENTICATED') {
    router.navigate(['/jogos']);
    return false;
  }

  router.navigate(['/auth/login']);
  return false;
};
