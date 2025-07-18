import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GlobalDialogService } from '../../shared/services/global-dialog.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const globalDialogService = inject(GlobalDialogService);

  return next(req).pipe(
    catchError((error: any) => {
      let errorMessage = 'Erro inesperado';

      if (error.status === 401) {
        errorMessage = 'Não autorizado. Verifique suas credenciais.';
      } else if (error.status === 403) {
        errorMessage = 'Acesso negado';
      } else if (error.status === 404) {
        errorMessage = 'Recurso não encontrado';
      } else if (error.status === 422) {
        errorMessage = error.error?.message || 'Dados inválidos';
      } else if (error.status === 500) {
        errorMessage = 'Erro interno do servidor';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      globalDialogService.showError('Erro', errorMessage);
      return throwError(() => error);
    })
  );
};
