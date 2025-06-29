import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Como usamos cookies httpOnly, não precisamos adicionar headers JWT manualmente
    // O navegador já envia os cookies automaticamente

    // Garantimos que todas as requisições incluam credentials para cookies
    const authReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    return next.handle(authReq);
  }
}
