import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResolverLoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private activeResolvers = new Set<string>();

  get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  startResolverLoading(resolverId: string): void {
    this.activeResolvers.add(resolverId);
    this.updateLoadingState();
  }

  finishResolverLoading(resolverId: string): void {
    this.activeResolvers.delete(resolverId);
    this.updateLoadingState();
  }

  private updateLoadingState(): void {
    const isLoading = this.activeResolvers.size > 0;
    this.loadingSubject.next(isLoading);
  }

  reset(): void {
    this.activeResolvers.clear();
    this.loadingSubject.next(false);
  }
}
