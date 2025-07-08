import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

/**
 * Interceptor específico para lidar com problemas de sessão em iOS PWA.
 *
 * Este interceptor resolve problemas conhecidos do iOS PWA com autenticação baseada em cookies http-only:
 * 1. Safari no iOS pode ter problemas com cookies em modo standalone
 * 2. Sessões podem expirar de forma inesperada quando o PWA fica em background
 * 3. Cache agressivo pode interferir com validação de sessão
 *
 * Estratégias implementadas:
 * - Detecção automática se está rodando em iOS PWA
 * - Headers específicos para forçar bypass de cache
 * - Múltiplas estratégias de refresh de sessão
 * - Tratamento gracioso de erros de sessão
 *
 * Compatível com autenticação http-only cookies (não usa localStorage para tokens).
 */
@Injectable()
export class IosPwaSessionInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Adicionar headers específicos para iOS PWA
    const iosRequest = req.clone({
      setHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'X-iOS-PWA': 'true',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    return next.handle(iosRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.isIosPwa()) {
          return this.handleIosSessionError(iosRequest, next);
        }
        return throwError(error);
      })
    );
  }

  private handleIosSessionError(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      // Tentar renovar a sessão usando estratégias específicas para cookies http-only
      return this.refreshSession().pipe(
        switchMap(() => {
          this.isRefreshing = false;
          // Reenviar a requisição original com headers atualizados
          const retryRequest = request.clone({
            setHeaders: {
              'X-iOS-PWA-Retry': 'true',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          });
          return next.handle(retryRequest);
        }),
        catchError((error) => {
          this.isRefreshing = false;
          // Se falhar, limpar qualquer estado local e redirecionar para login
          // Note: com cookies http-only, não precisamos limpar tokens locais
          // mas podemos limpar outros dados da aplicação
          try {
            localStorage.removeItem('user-preferences');
            sessionStorage.clear();
          } catch (e) {
            console.warn('Error clearing local storage:', e);
          }

          // Redirecionar para login com parâmetro indicando sessão expirada
          this.router.navigate(['/login'], {
            queryParams: {
              reason: 'session-expired',
              platform: 'ios-pwa',
            },
          });
          return throwError(error);
        })
      );
    }

    // Se já estamos tentando refresh, aguardar um pouco e falhar
    return throwError('Session refresh already in progress');
  }

  private refreshSession(): Observable<any> {
    // Para autenticação baseada em cookies http-only, tentamos diferentes estratégias

    return new Observable((observer) => {
      // Estratégia 1: Tentar endpoint específico de refresh
      this.tryRefreshEndpoint()
        .then((success) => {
          if (success) {
            observer.next(success);
            observer.complete();
            return Promise.resolve(true);
          } else {
            // Estratégia 2: Tentar revalidar sessão atual
            return this.validateCurrentSession();
          }
        })
        .then((isValid) => {
          if (isValid) {
            observer.next(true);
            observer.complete();
            return Promise.resolve(true);
          } else {
            // Estratégia 3: Tentar "tocar" a sessão para renovar
            return this.touchSession();
          }
        })
        .then((touched) => {
          if (touched) {
            observer.next(true);
            observer.complete();
          } else {
            observer.error('All session refresh strategies failed');
          }
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  private async tryRefreshEndpoint(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-iOS-PWA': 'true',
          'X-iOS-PWA-Session-Refresh': 'true',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        credentials: 'include',
        cache: 'no-cache',
      });

      if (response.ok) {
        // Verificar se a sessão foi realmente renovada
        return await this.validateCurrentSession();
      }

      return false;
    } catch (error) {
      console.warn('Refresh endpoint not available or failed:', error);
      return false;
    }
  }

  private async touchSession(): Promise<boolean> {
    try {
      // Tentar fazer uma chamada simples que pode renovar o cookie
      const response = await fetch('/api/auth/ping', {
        method: 'GET',
        headers: {
          'X-iOS-PWA': 'true',
          'X-iOS-PWA-Touch': 'true',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        credentials: 'include',
        cache: 'no-cache',
      });

      // Se ping não existir, tentar uma rota que provavelmente existe
      if (!response.ok && response.status === 404) {
        const fallbackResponse = await fetch('/api/users/me', {
          method: 'GET',
          headers: {
            'X-iOS-PWA': 'true',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          credentials: 'include',
          cache: 'no-cache',
        });

        return fallbackResponse.ok;
      }

      return response.ok;
    } catch (error) {
      console.warn('Touch session failed:', error);
      return false;
    }
  }

  private async validateCurrentSession(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-iOS-PWA': 'true',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        credentials: 'include', // Incluir cookies http-only
        cache: 'no-cache',
      });

      return response.ok;
    } catch (error) {
      console.warn('Session validation failed:', error);
      return false;
    }
  }

  private isIosPwa(): boolean {
    return (
      (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) &&
      (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone)
    );
  }
}
