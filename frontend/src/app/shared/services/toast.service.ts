import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ToastOptions {
  severity?: ToastSeverity;
  summary?: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private messageService: MessageService) { }

  show(options: ToastOptions): void {
    this.messageService.add({
      severity: options.severity || 'info',
      summary: options.summary || '',
      detail: options.detail || '',
      life: options.life || 5000,
      sticky: options.sticky || false,
      closable: options.closable !== false
    });
  }

  success(summary: string, detail?: string, life?: number): void {
    this.show({
      severity: 'success',
      summary,
      detail,
      life
    });
  }

  error(summary: string, detail?: string, life?: number): void {
    this.show({
      severity: 'error',
      summary,
      detail,
      life: life || 8000
    });
  }

  warn(summary: string, detail?: string, life?: number): void {
    this.show({
      severity: 'warn',
      summary,
      detail,
      life
    });
  }

  info(summary: string, detail?: string, life?: number): void {
    this.show({
      severity: 'info',
      summary,
      detail,
      life
    });
  }

  clear(): void {
    this.messageService.clear();
  }
}
