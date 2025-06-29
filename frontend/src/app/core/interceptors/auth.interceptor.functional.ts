import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Como usamos cookies httpOnly, não precisamos adicionar headers JWT manualmente
  // O navegador já envia os cookies automaticamente

  // Garantimos que todas as requisições incluam credentials para cookies
  const authReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json'
    },
    withCredentials: true
  });

  return next(authReq);
};
