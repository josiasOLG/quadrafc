import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Pegar o token do localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    // Criar headers base
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Adicionar token se existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Clonar requisição com novos headers
    const authReq = req.clone({
      setHeaders: headers,
    });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Se for erro 401 e temos um token, tentar renovar
        if (
          error.status === 401 &&
          token &&
          !req.url.includes('/auth/login') &&
          !req.url.includes('/auth/refresh')
        ) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const apiUrl = environment.apiUrl || 'http://localhost:3000/api';

      return this.http
        .post<{ access_token: string }>(
          `${apiUrl}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          }
        )
        .pipe(
          switchMap((tokenResponse: any) => {
            this.isRefreshing = false;
            const newToken = tokenResponse.access_token;
            localStorage.setItem('access_token', newToken);
            this.refreshTokenSubject.next(newToken);

            // Reenviar a requisição original com o novo token
            const authReq = request.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next.handle(authReq);
          }),
          catchError((error) => {
            this.isRefreshing = false;
            // Se não conseguir renovar, limpar token e redirecionar para login
            localStorage.removeItem('access_token');
            // Aqui você pode adicionar lógica para redirecionar para login se necessário
            return throwError(() => error);
          })
        );
    } else {
      // Se já estamos renovando, aguardar o novo token
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          const authReq = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
          return next.handle(authReq);
        })
      );
    }
  }
}
