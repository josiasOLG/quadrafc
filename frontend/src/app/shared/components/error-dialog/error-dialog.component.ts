import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { Subject, takeUntil } from 'rxjs';
import { DialogData, GlobalDialogService } from '../../services/global-dialog.service';

@Component({
  selector: 'app-global-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, CardModule, DividerModule],
  templateUrl: './error-dialog.component.html',
  styleUrl: './error-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  dialogData: DialogData | null = null;
  visible = false;

  constructor(private globalDialogService: GlobalDialogService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.globalDialogService.dialog$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.dialogData = data;
      this.visible = !!data;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onHide(): void {
    this.globalDialogService.hide();
  }

  executeAction(action: () => void): void {
    action();
  }

  trackByActionLabel(index: number, action: any): string {
    return action.label;
  }

  getActionClass(severity?: string): string {
    const baseClass = 'w-full lg:w-auto';

    switch (severity) {
      case 'danger':
        return `${baseClass} p-button-danger`;
      case 'secondary':
        return `${baseClass} p-button-secondary`;
      case 'success':
        return `${baseClass} p-button-success`;
      case 'primary':
      default:
        return `${baseClass}`;
    }
  }

  getDialogIcon(): string {
    if (!this.dialogData) return '';

    switch (this.dialogData.type) {
      case 'success':
        return 'pi pi-check-circle';
      case 'error':
        return 'pi pi-exclamation-triangle';
      case 'warning':
        return 'pi pi-exclamation-triangle';
      case 'info':
        return 'pi pi-info-circle';
      default:
        return 'pi pi-info-circle';
    }
  }

  getDialogColorClass(): string {
    if (!this.dialogData) return '';

    switch (this.dialogData.type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }

  getDialogIconContainerClass(): string {
    if (!this.dialogData) return '';

    switch (this.dialogData.type) {
      case 'success':
        return 'success-icon';
      case 'error':
        return 'error-icon';
      case 'warning':
        return 'warning-icon';
      case 'info':
        return 'info-icon';
      default:
        return 'default-icon';
    }
  }

  getDialogSubtitle(): string {
    if (!this.dialogData) return '';

    switch (this.dialogData.type) {
      case 'success':
        return 'Operação bem-sucedida';
      case 'error':
        return 'Algo deu errado';
      case 'warning':
        return 'Atenção necessária';
      case 'info':
        return 'Informação importante';
      default:
        return '';
    }
  }
}
