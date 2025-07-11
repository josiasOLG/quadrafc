import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * Serviço global para gerenciar estado de loading em navegação
 * Automaticamente reseta o loading quando muda de rota
 */
@Injectable({
  providedIn: 'root',
})
export class RouteLoadingService {
  private routeLoadingSubject = new BehaviorSubject<boolean>(false);
  private routeChangeSubject = new BehaviorSubject<string>('');

  constructor(private router: Router) {
    // Escuta mudanças de rota
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Emite que a rota mudou
        this.routeChangeSubject.next(event.url);
        
        // Força loading por um breve momento para garantir que o skeleton apareça
        this.setRouteLoading(true);
        
        // Reseta o loading após animação de rota (300ms)
        setTimeout(() => {
          this.setRouteLoading(false);
        }, 100);
      });
  }

  /**
   * Observable que emite quando a rota muda
   */
  get routeChange$(): Observable<string> {
    return this.routeChangeSubject.asObservable();
  }

  /**
   * Observable para o estado de loading da rota
   */
  get routeLoading$(): Observable<boolean> {
    return this.routeLoadingSubject.asObservable();
  }

  /**
   * Força um estado de loading
   */
  private setRouteLoading(loading: boolean): void {
    this.routeLoadingSubject.next(loading);
  }

  /**
   * Verifica se está em loading de rota
   */
  isRouteLoading(): boolean {
    return this.routeLoadingSubject.value;
  }
}
