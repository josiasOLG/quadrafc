import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppModalComponent } from '../app-modal/app-modal.component';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmIcon?: string;
  cancelIcon?: string;
  severity?: 'info' | 'warn' | 'error' | 'success';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, AppModalComponent],
  template: `
    <app-modal
      [visible]="visible"
      [header]="data.title || 'Confirmar'"
      [showFooter]="true"
      [confirmLabel]="data.confirmText || 'Confirmar'"
      [cancelLabel]="data.cancelText || 'Cancelar'"
      [confirmIcon]="data.confirmIcon || 'pi pi-check'"
      [cancelIcon]="data.cancelIcon || 'pi pi-times'"
      [width]="'400px'"
      [loading]="loading"
      (onConfirm)="handleConfirm()"
      (onCancel)="handleCancel()"
      (onHide)="handleHide()"
    >
      <div class="confirm-dialog-content">
        <div class="flex align-items-center gap-3 mb-3">
          <i
            [class]="getSeverityIcon()"
            [style.color]="getSeverityColor()"
            style="font-size: 2rem;"
          ></i>
          <div class="flex-1">
            <p class="m-0 text-900 font-medium" [innerHTML]="data.message"></p>
          </div>
        </div>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .confirm-dialog-content {
        min-height: 60px;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() data: ConfirmDialogData = { message: '' };
  @Input() loading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() hide = new EventEmitter<void>();

  handleConfirm(): void {
    this.confirm.emit();
  }

  handleCancel(): void {
    this.cancelled.emit();
  }

  handleHide(): void {
    this.visible = false;
    this.hide.emit();
  }

  getSeverityIcon(): string {
    switch (this.data.severity) {
      case 'warn':
        return 'pi pi-exclamation-triangle';
      case 'error':
        return 'pi pi-times-circle';
      case 'success':
        return 'pi pi-check-circle';
      case 'info':
      default:
        return 'pi pi-question-circle';
    }
  }

  getSeverityColor(): string {
    switch (this.data.severity) {
      case 'warn':
        return 'var(--yellow-500)';
      case 'error':
        return 'var(--red-500)';
      case 'success':
        return 'var(--green-500)';
      case 'info':
      default:
        return 'var(--blue-500)';
    }
  }
}
