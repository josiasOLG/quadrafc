import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './app-modal.component.html',
  styleUrl: './app-modal.component.scss'
})
export class AppModalComponent {
  @Input() visible: boolean = false;
  @Input() header: string = '';
  @Input() width: string = '50vw';
  @Input() height: string = 'auto';
  @Input() modal: boolean = true;
  @Input() dismissableMask: boolean = true;
  @Input() closable: boolean = true;
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = false;
  @Input() confirmLabel: string = 'Confirmar';
  @Input() cancelLabel: string = 'Cancelar';
  @Input() confirmIcon: string = '';
  @Input() cancelIcon: string = '';
  @Input() loading: boolean = false;

  @Output() onShow = new EventEmitter<void>();
  @Output() onHide = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  get responsiveOptions(): any {
    return {
      '960px': '75vw',
      '640px': '90vw'
    };
  }

  handleShow(): void {
    this.onShow.emit();
  }

  handleHide(): void {
    this.visible = false;
    this.onHide.emit();
  }

  handleConfirm(): void {
    this.onConfirm.emit();
  }

  handleCancel(): void {
    this.handleHide();
    this.onCancel.emit();
  }
}
