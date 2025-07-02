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
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('AuthInterceptor: Interceptando requisição para:', req.url);

    // Para o backend que usa cookies httpOnly, precisamos apenas garantir
    // que os cookies sejam incluídos nas requisições
    const authReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Essencial para cookies httpOnly
    });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('AuthInterceptor: Erro na requisição:', error.status, error.url);

        // Se erro 401, pode ser problema de autenticação
        if (error.status === 401) {
          console.log('AuthInterceptor: Erro 401 - Token inválido ou expirado');

          // Limpar dados de autenticação local
          localStorage.removeItem('quadrafc_admin_user');
          localStorage.removeItem('quadrafc_admin_auth');

          // Limpar cookies
          document.cookie = 'quadrafc_admin_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'quadrafc_admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

          // Só redirecionar se não estiver já na página de login
          if (!window.location.pathname.includes('/login')) {
            console.log('AuthInterceptor: Redirecionando para login');
            this.router.navigate(['/login']);
          }
        }

        return throwError(() => error);
      })
    );
  }
}
