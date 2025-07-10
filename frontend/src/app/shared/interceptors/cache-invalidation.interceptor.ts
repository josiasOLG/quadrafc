import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

export const cacheInvalidationInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheService = inject(CacheService);

  return next(req).pipe(
    tap(() => {
      // Invalida cache após operações de escrita que afetam dados de jogos/palpites
      if (
        (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') &&
        (req.url.includes('/palpites') ||
          req.url.includes('/jogos') ||
          req.url.includes('/rodadas'))
      ) {
        // Executa invalidação de forma assíncrona sem bloquear a resposta
        setTimeout(() => {
          cacheService.invalidateAfterWrite();
        }, 100);
      }
    })
  );
};
