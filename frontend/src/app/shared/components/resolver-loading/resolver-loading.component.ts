import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ResolverLoadingService } from '../../../core/services/resolver-loading.service';

@Component({
  selector: 'app-resolver-loading',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    @if (loadingService.isLoading$ | async) {
    <div class="resolver-loading">
      <div class="resolver-loading__backdrop"></div>
      <div class="resolver-loading__container">
        <p-progressSpinner
          [style]="{ width: '60px', height: '60px' }"
          strokeWidth="4"
          animationDuration="1s"
        >
        </p-progressSpinner>
        <p class="resolver-loading__text">Carregando dados...</p>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .resolver-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;

        &__backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
        }

        &__container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 200px;
        }

        &__text {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-color-secondary);
          text-align: center;
          font-weight: 500;
        }
      }

      :host ::ng-deep .p-progress-spinner-circle {
        stroke: var(--primary-color);
      }
    `,
  ],
})
export class ResolverLoadingComponent {
  constructor(public loadingService: ResolverLoadingService) {}
}
