import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Serviço global simples para forçar loading em qualquer componente
 * quando há mudança de rota. 
 * 
 * SUPER SIMPLES DE USAR:
 * 1. Adiciona este serviço no app.config.ts
 * 2. Injeta em qualquer componente que precise de loading automático
 * 3. Chama forceLoadingOnRoute() no ngOnInit
 */
@Injectable({
  providedIn: 'root'
})
export class GlobalLoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  // Observable que qualquer componente pode escutar
  loading$ = this.loadingSubject.asObservable();

  /**
   * Força loading por um período determinado
   */
  forceLoading(duration: number = 200): void {
    this.loadingSubject.next(true);
    
    setTimeout(() => {
      this.loadingSubject.next(false);
    }, duration);
  }

  /**
   * Método específico para chamar quando há mudança de rota
   */
  onRouteChange(): void {
    this.forceLoading(150);
  }

  /**
   * Getter para saber se está em loading
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Setter manual para loading
   */
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}
