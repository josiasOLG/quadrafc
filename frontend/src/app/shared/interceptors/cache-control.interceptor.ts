import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class CacheControlInterceptor implements HttpInterceptor {
  // Endpoints que devem sempre ter dados frescos
  private readonly freshEndpoints = [
    '/api/jogos/campeonatos',
    '/api/jogos/data',
    '/api/palpites',
    '/api/rodadas',
  ];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Verifica se é um endpoint que precisa de dados frescos
    const needsFreshData = this.freshEndpoints.some((endpoint) => req.url.includes(endpoint));

    if (needsFreshData && req.method === 'GET') {
      // Adiciona headers para garantir dados frescos
      const freshReq = req.clone({
        setHeaders: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        setParams: {
          _t: Date.now().toString(),
        },
      });

      return next.handle(freshReq);
    }

    return next.handle(req);
  }
}
