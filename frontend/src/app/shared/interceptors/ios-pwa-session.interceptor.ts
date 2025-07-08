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
    // Detectar se está rodando em iOS PWA
    const isIosPwaMode = this.isIosPwa();

    // Adicionar headers específicos para iOS PWA
    const iosRequest = req.clone({
      setHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'X-iOS-PWA': isIosPwaMode ? 'true' : 'false',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (isIosPwaMode) {
      console.log('iOS PWA: Interceptando requisição para:', req.url);
    }

    return next.handle(iosRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && isIosPwaMode) {
          console.warn('iOS PWA: Erro 401 detectado para URL:', req.url);
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
      console.log('iOS PWA: Iniciando processo de renovação de sessão');
      this.isRefreshing = true;

      // Tentar renovar a sessão usando estratégias específicas para cookies http-only
      return this.refreshSession().pipe(
        switchMap(() => {
          console.log('iOS PWA: Sessão renovada com sucesso, reenviando requisição');
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
          console.error('iOS PWA: Falha na renovação de sessão:', error);
          this.isRefreshing = false;
          // Se falhar, limpar qualquer estado local e redirecionar para login
          // Note: com cookies http-only, não precisamos limpar tokens locais
          // mas podemos limpar outros dados da aplicação
          try {
            localStorage.removeItem('user-preferences');
            sessionStorage.clear();
          } catch (e) {
            console.warn('iOS PWA: Erro ao limpar storage local:', e);
          }

          // Redirecionar para login com parâmetro indicando sessão expirada
          console.log('iOS PWA: Redirecionando para login devido à sessão expirada');
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
    console.warn('iOS PWA: Refresh já em progresso, rejeitando requisição');
    return throwError('Session refresh already in progress');
  }

  private refreshSession(): Observable<any> {
    // Para autenticação baseada em cookies http-only, tentamos diferentes estratégias
    console.log('iOS PWA: Iniciando estratégias de renovação de sessão');

    return new Observable((observer) => {
      // Estratégia 1: Tentar endpoint específico de refresh
      this.tryRefreshEndpoint()
        .then((success) => {
          if (success) {
            console.log('iOS PWA: Estratégia 1 (refresh endpoint) bem-sucedida');
            observer.next(success);
            observer.complete();
            return Promise.resolve(true);
          } else {
            console.log('iOS PWA: Estratégia 1 falhou, tentando estratégia 2');
            // Estratégia 2: Tentar revalidar sessão atual
            return this.validateCurrentSession();
          }
        })
        .then((isValid) => {
          if (isValid) {
            console.log('iOS PWA: Estratégia 2 (validação) bem-sucedida');
            observer.next(true);
            observer.complete();
            return Promise.resolve(true);
          } else {
            console.log('iOS PWA: Estratégia 2 falhou, tentando estratégia 3');
            // Estratégia 3: Tentar "tocar" a sessão para renovar
            return this.touchSession();
          }
        })
        .then((touched) => {
          if (touched) {
            console.log('iOS PWA: Estratégia 3 (touch session) bem-sucedida');
            observer.next(true);
            observer.complete();
          } else {
            console.error('iOS PWA: Todas as estratégias de renovação falharam');
            observer.error('All session refresh strategies failed');
          }
        })
        .catch((error) => {
          console.error('iOS PWA: Erro durante renovação de sessão:', error);
          observer.error(error);
        });
    });
  }

  private async tryRefreshEndpoint(): Promise<boolean> {
    try {
      console.log('iOS PWA: Tentando renovar sessão via endpoint refresh');
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
        console.log('iOS PWA: Endpoint refresh bem-sucedido');
        // Aguardar um pouco para o cookie ser definido
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Verificar se a sessão foi realmente renovada
        const isValid = await this.validateCurrentSession();
        console.log('iOS PWA: Validação após refresh:', isValid);
        return isValid;
      }

      console.warn('iOS PWA: Endpoint refresh falhou com status:', response.status);
      return false;
    } catch (error) {
      console.warn('iOS PWA: Erro no endpoint refresh:', error);
      return false;
    }
  }

  private async touchSession(): Promise<boolean> {
    try {
      console.log('iOS PWA: Tentando "tocar" sessão via ping');
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

      // Se ping funcionar, sessão está válida
      if (response.ok) {
        console.log('iOS PWA: Ping bem-sucedido');
        return true;
      }

      console.log('iOS PWA: Ping falhou, tentando fallback para /me');
      // Se ping não existir, tentar uma rota que provavelmente existe
      if (response.status === 404) {
        const fallbackResponse = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'X-iOS-PWA': 'true',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          credentials: 'include',
          cache: 'no-cache',
        });

        const success = fallbackResponse.ok;
        console.log('iOS PWA: Fallback /me resultado:', success);
        return success;
      }

      console.warn('iOS PWA: Touch session falhou com status:', response.status);
      return false;
    } catch (error) {
      console.warn('iOS PWA: Erro no touch session:', error);
      return false;
    }
  }

  private async validateCurrentSession(): Promise<boolean> {
    try {
      console.log('iOS PWA: Validando sessão atual');
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

      const isValid = response.ok;
      console.log('iOS PWA: Validação de sessão resultado:', isValid, 'Status:', response.status);
      return isValid;
    } catch (error) {
      console.warn('iOS PWA: Erro na validação de sessão:', error);
      return false;
    }
  }

  private isIosPwa(): boolean {
    const isIOS = navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad');
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    const result = isIOS && (isStandalone || isSafari);

    if (result) {
      console.log('iOS PWA: Detecção confirmada', {
        isIOS,
        isStandalone,
        isSafari,
        userAgent: navigator.userAgent,
      });
    }

    return result;
  }
}
