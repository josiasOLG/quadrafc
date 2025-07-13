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

export interface BaseDialogOptions {
  title: string;
  message: string;
  details?: string;
  btnTitleClose?: string;
}

export interface SuccessDialogOptions extends BaseDialogOptions {
  duration?: number;
}

export interface CriticalErrorDialogOptions extends BaseDialogOptions {
  code?: string;
}

type ErrorDialogOptions = BaseDialogOptions;
type WarningDialogOptions = BaseDialogOptions;
type InfoDialogOptions = BaseDialogOptions;

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

  private normalizeOptions<T extends BaseDialogOptions>(
    optionsOrTitle: T | string,
    message?: string,
    details?: string,
    defaultBtnTitle = 'Fechar',
    additionalParams?: any
  ): T {
    if (typeof optionsOrTitle === 'string') {
      return {
        title: optionsOrTitle,
        message: message!,
        details,
        btnTitleClose: defaultBtnTitle,
        ...additionalParams,
      } as T;
    }

    return {
      btnTitleClose: defaultBtnTitle,
      ...additionalParams,
      ...optionsOrTitle,
    } as T;
  }

  private createStandardAction(
    label: string,
    severity: DialogAction['severity'] = 'primary'
  ): DialogAction {
    return {
      label,
      action: () => this.hide(),
      severity,
    };
  }

  showError(options: ErrorDialogOptions): void;
  showError(title: string, message: string, details?: string): void;
  showError(optionsOrTitle: ErrorDialogOptions | string, message?: string, details?: string): void {
    const options = this.normalizeOptions(optionsOrTitle, message, details, 'Fechar');

    this.show({
      type: 'error',
      title: options.title,
      message: options.message,
      details: options.details,
      actions: [this.createStandardAction(options.btnTitleClose!)],
    });
  }

  showSuccess(options: SuccessDialogOptions): void;
  showSuccess(
    title: string,
    message: string,
    details?: string,
    duration?: number,
    btnTitleClose?: string
  ): void;
  showSuccess(
    optionsOrTitle: SuccessDialogOptions | string,
    message?: string,
    details?: string,
    duration?: number,
    btnTitleClose?: string
  ): void {
    const options = this.normalizeOptions(
      optionsOrTitle,
      message,
      details,
      btnTitleClose || 'Fechar',
      { duration: duration || 3000 }
    );

    this.show({
      type: 'success',
      title: options.title,
      message: options.message,
      details: options.details,
      duration: options.duration,
      actions: [this.createStandardAction(options.btnTitleClose!, 'success')],
    });
  }

  showWarning(options: WarningDialogOptions): void;
  showWarning(title: string, message: string, details?: string): void;
  showWarning(
    optionsOrTitle: WarningDialogOptions | string,
    message?: string,
    details?: string
  ): void {
    const options = this.normalizeOptions(optionsOrTitle, message, details, 'Entendi');

    this.show({
      type: 'warning',
      title: options.title,
      message: options.message,
      details: options.details,
      actions: [this.createStandardAction(options.btnTitleClose!)],
    });
  }

  showInfo(options: InfoDialogOptions): void;
  showInfo(title: string, message: string, details?: string): void;
  showInfo(optionsOrTitle: InfoDialogOptions | string, message?: string, details?: string): void {
    const options = this.normalizeOptions(optionsOrTitle, message, details, 'Ok');

    this.show({
      type: 'info',
      title: options.title,
      message: options.message,
      details: options.details,
      actions: [this.createStandardAction(options.btnTitleClose!)],
    });
  }

  showCriticalError(options: CriticalErrorDialogOptions): void;
  showCriticalError(
    title: string,
    message: string,
    details?: string,
    code?: string,
    btnTitleClose?: string
  ): void;
  showCriticalError(
    optionsOrTitle: CriticalErrorDialogOptions | string,
    message?: string,
    details?: string,
    code?: string,
    btnTitleClose?: string
  ): void {
    const options = this.normalizeOptions(
      optionsOrTitle,
      message,
      details,
      btnTitleClose || 'Fechar',
      { code }
    );

    this.show({
      type: 'error',
      title: options.title,
      message: options.message,
      details: options.details,
      code: options.code,
      closable: false,
      actions: [
        {
          label: 'Recarregar Página',
          action: () => window.location.reload(),
          severity: 'danger',
          icon: 'pi pi-refresh',
        },
        this.createStandardAction(options.btnTitleClose!, 'secondary'),
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
