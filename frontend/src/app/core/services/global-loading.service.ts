import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalLoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private activeResolvers = new Set<string>();

  startResolverLoading(resolverName: string): void {
    this.activeResolvers.add(resolverName);
    this.updateLoadingState();
  }

  endResolverLoading(resolverName: string): void {
    this.activeResolvers.delete(resolverName);
    this.updateLoadingState();
  }

  private updateLoadingState(): void {
    this.loadingSubject.next(this.activeResolvers.size > 0);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
