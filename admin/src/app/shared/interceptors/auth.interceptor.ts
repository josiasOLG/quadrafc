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
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRedirecting = false; // Flag para evitar múltiplos redirecionamentos
  private readonly AUTH_STORAGE_KEY = 'quadrafc_admin_auth';

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obter o token JWT do localStorage
    const token = localStorage.getItem(this.AUTH_STORAGE_KEY);

    // Preparar headers
    let headers: { [name: string]: string } = {
      'Content-Type': 'application/json',
    };

    // Adicionar o token de autorização, se disponível
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
    }

    // Clonar a requisição com os headers corretos
    const authReq = req.clone({
      setHeaders: headers,
    });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Tratamento específico para erros de autenticação
        if (error.status === 401 && !this.isRedirecting) {
          this.handleAuthError();
        }

        // Tratamento específico para erro de permissão
        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
        }

        return throwError(() => error);
      })
    );
  }

  private handleAuthError(): void {
    // Prevenir múltiplos redirecionamentos
    this.isRedirecting = true;

    // Limpar dados de autenticação
    localStorage.removeItem('quadrafc_admin_user');
    localStorage.removeItem('quadrafc_admin_auth');

    // Redirecionar apenas se não estiver na página de login
    if (!window.location.pathname.includes('/login')) {
      // Salvar URL atual para retornar após login
      const currentUrl = window.location.pathname;
      if (currentUrl !== '/' && !currentUrl.includes('/login')) {
        localStorage.setItem('returnUrl', currentUrl);
      }

      this.router
        .navigate(['/login'], {
          queryParams: { returnUrl: currentUrl },
          replaceUrl: true,
        })
        .then(() => {
          this.isRedirecting = false;
        });
    } else {
      this.isRedirecting = false;
    }
  }
}
