import { inject } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { ResolverLoadingService } from '../services/resolver-loading.service';

export function withResolverLoading<T>(
  resolverId: string,
  resolverFn: () => Observable<T>
): Observable<T> {
  const loadingService = inject(ResolverLoadingService);

  loadingService.startResolverLoading(resolverId);

  return resolverFn().pipe(
    finalize(() => {
      loadingService.finishResolverLoading(resolverId);
    })
  );
}
