import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type DialogType = 'success' | 'error' | 'warning' | 'info';

export interface DialogData {
  type: DialogType;
  title: string;
  message: string;
  details?: string;
  code?: string;
  actions?: DialogAction[];
  closable?: boolean;
  duration?: number;
}

export interface DialogAction {
  label: string;
  action: () => void;
  severity?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GlobalDialogService {
  private readonly dialogSubject = new BehaviorSubject<DialogData | null>(null);

  readonly dialog$ = this.dialogSubject.asObservable();

  show(data: DialogData): void {
    const dialogData: DialogData = {
      closable: true,
      duration: 0,
      ...data,
    };

    this.dialogSubject.next(dialogData);

    if (dialogData.duration && dialogData.duration > 0) {
      setTimeout(() => this.hide(), dialogData.duration);
    }
  }

  hide(): void {
    this.dialogSubject.next(null);
  }

  showError(title: string, message: string, details?: string): void {
    this.show({
      type: 'error',
      title,
      message,
      details,
      actions: [
        {
          label: 'Fechar',
          action: () => this.hide(),
          severity: 'primary',
        },
      ],
    });
  }

  showSuccess(title: string, message: string, details?: string, duration?: number): void {
    this.show({
      type: 'success',
      title,
      message,
      details,
      duration: duration || 3000,
      actions: [
        {
          label: 'Fechar',
          action: () => this.hide(),
          severity: 'success',
        },
      ],
    });
  }

  showWarning(title: string, message: string, details?: string): void {
    this.show({
      type: 'warning',
      title,
      message,
      details,
      actions: [
        {
          label: 'Entendi',
          action: () => this.hide(),
          severity: 'primary',
        },
      ],
    });
  }

  showInfo(title: string, message: string, details?: string): void {
    this.show({
      type: 'info',
      title,
      message,
      details,
      actions: [
        {
          label: 'Ok',
          action: () => this.hide(),
          severity: 'primary',
        },
      ],
    });
  }

  showCriticalError(title: string, message: string, details?: string, code?: string): void {
    this.show({
      type: 'error',
      title,
      message,
      details,
      code,
      closable: false,
      actions: [
        {
          label: 'Recarregar Página',
          action: () => window.location.reload(),
          severity: 'danger',
          icon: 'pi pi-refresh',
        },
        {
          label: 'Fechar',
          action: () => this.hide(),
          severity: 'secondary',
        },
      ],
    });
  }

  showRetryError(title: string, message: string, retryAction: () => void, details?: string): void {
    this.show({
      type: 'error',
      title,
      message,
      details,
      actions: [
        {
          label: 'Tentar Novamente',
          action: () => {
            this.hide();
            retryAction();
          },
          severity: 'primary',
          icon: 'pi pi-replay',
        },
        {
          label: 'Cancelar',
          action: () => this.hide(),
          severity: 'secondary',
        },
      ],
    });
  }
}
