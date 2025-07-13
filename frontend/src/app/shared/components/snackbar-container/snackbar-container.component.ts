import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { SnackbarMessage, SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-snackbar-container',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressBarModule],
  template: `
    <div class="snackbar-container" *ngIf="hasCustomMessages()">
      <div
        *ngFor="let message of customMessages(); trackBy: trackByMessageId"
        class="snackbar-item"
        [ngClass]="getSnackbarClasses(message)"
      >
        <div class="snackbar-content">
          <div class="snackbar-icon" *ngIf="message.icon">
            <i [class]="message.icon"></i>
          </div>

          <div class="snackbar-text">
            <div class="snackbar-summary" [innerHTML]="message.summary"></div>
            <div *ngIf="message.detail" class="snackbar-detail" [innerHTML]="message.detail"></div>
          </div>

          <div class="snackbar-actions" *ngIf="message.actions && message.actions.length > 0">
            <p-button
              *ngFor="let action of message.actions"
              [label]="action.label"
              [icon]="action.icon"
              [styleClass]="'p-button-sm p-button-text ' + (action.styleClass || '')"
              (onClick)="executeAction(action)"
            >
            </p-button>
          </div>

          <p-button
            *ngIf="message.closable"
            icon="pi pi-times"
            styleClass="p-button-text p-button-sm snackbar-close"
            (onClick)="closeMessage(message.id)"
          >
          </p-button>
        </div>

        <div *ngIf="isProgressMessage(message)" class="snackbar-progress">
          <p-progressBar mode="indeterminate" [style]="{ height: '3px' }"> </p-progressBar>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .snackbar-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        max-width: 400px;
        width: 100%;
        pointer-events: none;
      }

      .snackbar-item {
        margin-bottom: 0.75rem;
        border-radius: var(--qfc-radius-lg);
        box-shadow: var(--qfc-shadow-lg);
        backdrop-filter: blur(10px);
        border: 1px solid var(--surface-border);
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
        pointer-events: auto;
        min-height: 60px;
      }

      .snackbar-item.success {
        background: linear-gradient(
          135deg,
          rgba(34, 197, 94, 0.95) 0%,
          rgba(22, 163, 74, 0.95) 100%
        );
        color: white;
        border-color: rgba(34, 197, 94, 0.3);
      }

      .snackbar-item.error {
        background: linear-gradient(
          135deg,
          rgba(239, 68, 68, 0.95) 0%,
          rgba(220, 38, 38, 0.95) 100%
        );
        color: white;
        border-color: rgba(239, 68, 68, 0.3);
      }

      .snackbar-item.warn {
        background: linear-gradient(
          135deg,
          rgba(245, 158, 11, 0.95) 0%,
          rgba(217, 119, 6, 0.95) 100%
        );
        color: white;
        border-color: rgba(245, 158, 11, 0.3);
      }

      .snackbar-item.info {
        background: linear-gradient(
          135deg,
          rgba(59, 130, 246, 0.95) 0%,
          rgba(37, 99, 235, 0.95) 100%
        );
        color: white;
        border-color: rgba(59, 130, 246, 0.3);
      }

      .snackbar-content {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
        position: relative;
      }

      .snackbar-icon {
        font-size: 1.25rem;
        margin-top: 0.125rem;
        flex-shrink: 0;
      }

      .snackbar-text {
        flex: 1;
        min-width: 0;
      }

      .snackbar-summary {
        font-weight: 600;
        font-size: 0.875rem;
        line-height: 1.25;
        margin-bottom: 0.25rem;
      }

      .snackbar-detail {
        font-size: 0.8125rem;
        opacity: 0.9;
        line-height: 1.3;
      }

      .snackbar-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-shrink: 0;
      }

      .snackbar-close {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        opacity: 0.8;
      }

      .snackbar-close:hover {
        opacity: 1;
      }

      .snackbar-progress {
        margin-top: -1px;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @media (max-width: 768px) {
        .snackbar-container {
          top: auto;
          bottom: 1rem;
          left: 1rem;
          right: 1rem;
          max-width: none;
        }

        .snackbar-content {
          padding: 0.875rem;
          gap: 0.625rem;
        }

        .snackbar-actions {
          flex-direction: column;
          gap: 0.375rem;
        }
      }

      .snackbar-item ::ng-deep .p-button.p-button-text {
        color: inherit !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        background: rgba(255, 255, 255, 0.1) !important;
        transition: all 0.2s ease !important;
      }

      .snackbar-item ::ng-deep .p-button.p-button-text:hover {
        background: rgba(255, 255, 255, 0.2) !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
      }

      .snackbar-item ::ng-deep .p-progressbar {
        background: rgba(255, 255, 255, 0.2) !important;
      }

      .snackbar-item ::ng-deep .p-progressbar-value {
        background: rgba(255, 255, 255, 0.8) !important;
      }
    `,
  ],
})
export class SnackbarContainerComponent {
  private readonly snackbarService = inject(SnackbarService);

  customMessages = computed(() =>
    this.snackbarService
      .activeMessages()
      .filter(
        (m: SnackbarMessage) => (m.actions && m.actions.length > 0) || this.isProgressMessage(m)
      )
  );

  hasCustomMessages = computed(() => this.customMessages().length > 0);

  trackByMessageId(index: number, message: SnackbarMessage): string {
    return message.id;
  }

  getSnackbarClasses(message: SnackbarMessage): string {
    return `snackbar-${message.severity}`;
  }

  isProgressMessage(message: SnackbarMessage): boolean {
    return message.icon?.includes('spinner') || message.data?.showProgress === true;
  }

  executeAction(action: any): void {
    action.command();
  }

  closeMessage(id: string): void {
    this.snackbarService.remove(id);
  }
}
