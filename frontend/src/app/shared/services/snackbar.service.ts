import { computed, Injectable, signal } from '@angular/core';
import { MessageService } from 'primeng/api';

export interface SnackbarMessage {
  id: string;
  severity: 'success' | 'info' | 'warn' | 'error';
  summary: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
  actions?: SnackbarAction[];
  icon?: string;
  data?: any;
}

export interface SnackbarAction {
  label: string;
  icon?: string;
  command: () => void;
  styleClass?: string;
}

export interface SnackbarOptions {
  severity?: 'success' | 'info' | 'warn' | 'error';
  summary?: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
  actions?: SnackbarAction[];
  icon?: string;
  data?: any;
  showProgress?: boolean;
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
}

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private readonly messages = signal<SnackbarMessage[]>([]);
  private messageCounter = 0;

  readonly activeMessages = computed(() => this.messages());
  readonly hasMessages = computed(() => this.messages().length > 0);
  readonly messageCount = computed(() => this.messages().length);

  constructor(private messageService: MessageService) {}

  show(options: SnackbarOptions): string {
    const id = this.generateId();

    const message: SnackbarMessage = {
      id,
      severity: options.severity || 'info',
      summary: options.summary || '',
      detail: options.detail || '',
      life: options.life || this.getDefaultLife(options.severity || 'info'),
      sticky: options.sticky || false,
      closable: options.closable !== false,
      actions: options.actions || [],
      icon: options.icon || this.getDefaultIcon(options.severity || 'info'),
      data: options.data,
    };

    this.addMessage(message);
    this.showInPrimeNG(message);

    if (!message.sticky && message.life) {
      setTimeout(() => {
        this.remove(id);
      }, message.life);
    }

    return id;
  }

  success(summary: string, detail?: string, options?: Partial<SnackbarOptions>): string {
    return this.show({
      severity: 'success',
      summary,
      detail,
      ...options,
    });
  }

  error(summary: string, detail?: string, options?: Partial<SnackbarOptions>): string {
    return this.show({
      severity: 'error',
      summary,
      detail,
      life: options?.life || 8000,
      ...options,
    });
  }

  warn(summary: string, detail?: string, options?: Partial<SnackbarOptions>): string {
    return this.show({
      severity: 'warn',
      summary,
      detail,
      ...options,
    });
  }

  info(summary: string, detail?: string, options?: Partial<SnackbarOptions>): string {
    return this.show({
      severity: 'info',
      summary,
      detail,
      ...options,
    });
  }

  showWithActions(
    severity: 'success' | 'info' | 'warn' | 'error',
    summary: string,
    detail?: string,
    actions?: SnackbarAction[],
    options?: Partial<SnackbarOptions>
  ): string {
    return this.show({
      severity,
      summary,
      detail,
      actions,
      sticky: true,
      ...options,
    });
  }

  showProgress(summary: string, detail?: string, options?: Partial<SnackbarOptions>): string {
    return this.show({
      severity: 'info',
      summary,
      detail,
      icon: 'pi pi-spin pi-spinner',
      sticky: true,
      closable: false,
      showProgress: true,
      ...options,
    });
  }

  remove(id: string): void {
    const currentMessages = this.messages();
    const updatedMessages = currentMessages.filter((m) => m.id !== id);
    this.messages.set(updatedMessages);
    this.messageService.clear(id);
  }

  clear(): void {
    this.messages.set([]);
    this.messageService.clear();
  }

  clearBySeverity(severity: 'success' | 'info' | 'warn' | 'error'): void {
    const currentMessages = this.messages();
    const remainingMessages = currentMessages.filter((m) => m.severity !== severity);
    this.messages.set(remainingMessages);

    currentMessages
      .filter((m) => m.severity === severity)
      .forEach((m) => this.messageService.clear(m.id));
  }

  update(id: string, updates: Partial<SnackbarMessage>): void {
    const currentMessages = this.messages();
    const messageIndex = currentMessages.findIndex((m) => m.id === id);

    if (messageIndex !== -1) {
      const updatedMessage = { ...currentMessages[messageIndex], ...updates };
      const updatedMessages = [...currentMessages];
      updatedMessages[messageIndex] = updatedMessage;
      this.messages.set(updatedMessages);
    }
  }

  getMessage(id: string): SnackbarMessage | undefined {
    return this.messages().find((m) => m.id === id);
  }

  private addMessage(message: SnackbarMessage): void {
    const currentMessages = this.messages();
    this.messages.set([...currentMessages, message]);
  }

  private showInPrimeNG(message: SnackbarMessage): void {
    this.messageService.add({
      id: message.id,
      severity: message.severity,
      summary: message.summary,
      detail: message.detail,
      life: message.sticky ? undefined : message.life,
      sticky: message.sticky,
      closable: message.closable,
    });
  }

  private generateId(): string {
    return `snackbar_${++this.messageCounter}_${Date.now()}`;
  }

  private getDefaultLife(severity: string): number {
    switch (severity) {
      case 'error':
        return 8000;
      case 'warn':
        return 6000;
      case 'success':
        return 4000;
      case 'info':
      default:
        return 5000;
    }
  }

  private getDefaultIcon(severity: string): string {
    switch (severity) {
      case 'success':
        return 'pi pi-check-circle';
      case 'error':
        return 'pi pi-times-circle';
      case 'warn':
        return 'pi pi-exclamation-triangle';
      case 'info':
      default:
        return 'pi pi-info-circle';
    }
  }
}
