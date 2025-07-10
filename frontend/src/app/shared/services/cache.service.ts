import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  constructor() {}

  /**
   * Invalida cache específico após operações de escrita (POST/PUT/DELETE)
   */
  async invalidateAfterWrite(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();

        // Remove apenas cache de dados da API, mantém cache de assets
        for (const cacheName of cacheNames) {
          if (cacheName.includes('ngsw') && cacheName.includes('data')) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();

            for (const request of requests) {
              if (
                request.url.includes('/api/jogos') ||
                request.url.includes('/api/palpites') ||
                request.url.includes('/api/rodadas')
              ) {
                await cache.delete(request);
              }
            }
          }
        }

        console.log('✅ Cache invalidado após operação de escrita');
      } catch (error) {
        console.warn('Erro ao invalidar cache:', error);
      }
    }
  }

  /**
   * Configura sistema básico
   */
  setupAutoUpdate(): void {
    // Nada especial - deixa o service worker funcionar normalmente
  }
}
