import { Injectable } from '@angular/core';
import {
  NavigationStart,
  ResolveEnd,
  ResolveStart,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
} from '@angular/router';
import { ResolverLoadingService } from '../services/resolver-loading.service';

@Injectable({
  providedIn: 'root',
})
export class ResolverLoadingInterceptor {
  private activeResolvers = new Set<string>();

  constructor(private router: Router, private loadingService: ResolverLoadingService) {
    this.initializeRouterEvents();
  }

  private initializeRouterEvents(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof ResolveStart) {
        const resolverId = `${event.url}-${event.id}`;
        this.activeResolvers.add(resolverId);
        this.loadingService.startResolverLoading(resolverId);
      } else if (event instanceof ResolveEnd) {
        const resolverId = `${event.url}-${event.id}`;
        this.activeResolvers.delete(resolverId);
        this.loadingService.finishResolverLoading(resolverId);
      } else if (event instanceof NavigationStart) {
        this.loadingService.reset();
        this.activeResolvers.clear();
      } else if (event instanceof RouteConfigLoadStart) {
        this.loadingService.startResolverLoading('lazy-loading');
      } else if (event instanceof RouteConfigLoadEnd) {
        this.loadingService.finishResolverLoading('lazy-loading');
      }
    });
  }
}
