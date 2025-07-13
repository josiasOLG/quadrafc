import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';

interface JogoComPalpite {
  _id?: string;
  timeA: {
    nome: string;
    escudo?: string;
  };
  timeB: {
    nome: string;
    escudo?: string;
  };
  data: string;
  status: 'aberto' | 'encerrado' | 'ao_vivo' | 'agendado' | 'finalizado';
  campeonato: string;
  estadio?: string;
  palpites?: any[];
  resultado?: any;
}

@Component({
  selector: 'app-palpite-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputNumberModule],
  templateUrl: './palpite-dialog.component.html',
  styleUrls: ['./palpite-dialog.component.scss'],
})
export class PalpiteDialogComponent {
  @Input() visible = false;
  @Input() jogo: JogoComPalpite | null = null;
  @Input() palpiteForm!: FormGroup;
  @Input() isSubmitting = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submitPalpite = new EventEmitter<void>();
  @Output() dialogClose = new EventEmitter<void>();

  onDialogHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.dialogClose.emit();
  }

  closeDialog(): void {
    this.onDialogHide();
  }

  onSubmit(): void {
    if (this.palpiteForm.valid && !this.isSubmitting) {
      this.submitPalpite.emit();
    }
  }

  formatDataHora(dataHora: string): string {
    const data = new Date(dataHora);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }
}
