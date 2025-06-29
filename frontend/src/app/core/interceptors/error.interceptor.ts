import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private toastService: ToastService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Erro inesperado';

        // Tratamento específico por status code
        switch (error.status) {
          case 0:
            errorMessage = 'Erro de conexão. Verifique sua internet.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Dados inválidos';
            break;
          case 401:
            errorMessage = 'Sessão expirada. Faça login novamente.';
            this.toastService.error('Sessão Expirada', errorMessage);
            this.router.navigate(['/auth/login']);
            return throwError(() => error);
          case 403:
            errorMessage = 'Acesso negado';
            break;
          case 404:
            errorMessage = 'Recurso não encontrado';
            break;
          case 409:
            errorMessage = error.error?.message || 'Conflito de dados';
            break;
          case 422:
            errorMessage = error.error?.message || 'Dados inválidos';
            break;
          case 429:
            errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Serviço temporariamente indisponível';
            break;
          default:
            errorMessage = error.error?.message || `Erro ${error.status}`;
        }

        // Só mostra toast para erros que não são 401 (já tratado acima)
        if (error.status !== 401) {
          this.toastService.error('Erro', errorMessage);
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
