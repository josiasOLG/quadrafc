import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Variável para evitar múltiplas tentativas de refresh simultâneas
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);

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

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se for erro 401 e temos um token, tentar renovar uma única vez
      if (
        error.status === 401 &&
        token &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/register') &&
        !isRefreshing
      ) {
        isRefreshing = true;
        const apiUrl = environment.apiUrl || 'http://localhost:3000/api';

        return http
          .post<{ access_token: string }>(
            `${apiUrl}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )
          .pipe(
            switchMap((tokenResponse: any) => {
              isRefreshing = false;
              const newToken = tokenResponse.access_token;
              localStorage.setItem('access_token', newToken);

              // Reenviar a requisição original com o novo token
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                  'Content-Type': 'application/json',
                },
              });
              return next(retryReq);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              // Se não conseguir renovar, limpar token e não fazer mais tentativas
              localStorage.removeItem('access_token');
              console.warn('Falha na renovação automática do token:', refreshError);
              return throwError(() => refreshError);
            })
          );
      }
      return throwError(() => error);
    })
  );
};
