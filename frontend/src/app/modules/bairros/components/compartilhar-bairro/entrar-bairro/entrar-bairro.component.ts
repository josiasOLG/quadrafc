import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-entrar-bairro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    CardModule,
    MessageModule,
  ],
  template: `
    <p-card>
      <div class="text-center">
        <h2 class="text-xl font-semibold mb-2">Entrar em Bairro</h2>
        <p class="text-color-secondary mb-4 line-height-3">
          Digite o código de um amigo para entrar no bairro dele e participar dos rankings locais
        </p>

        <div class="flex flex-column gap-3 max-w-20rem mx-auto">
          <div class="flex flex-column gap-2">
            <label for="codigo" class="font-semibold text-left">Código do Bairro</label>
            <input
              id="codigo"
              type="text"
              pInputText
              [(ngModel)]="codigo"
              placeholder="Digite o código aqui..."
              class="text-center uppercase"
              [disabled]="loading"
              (keyup.enter)="onSubmit()"
              autocomplete="off"
            />
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-content-between gap-2">
          <p-button
            label="Voltar"
            icon="pi pi-arrow-left"
            [outlined]="true"
            [disabled]="loading"
            (onClick)="previousStep.emit()"
          >
          </p-button>

          <p-button
            label="Entrar no Bairro"
            icon="pi pi-check"
            iconPos="right"
            [disabled]="!codigo || loading"
            [loading]="loading"
            (onClick)="onSubmit()"
          >
          </p-button>
        </div>
      </ng-template>
    </p-card>
  `,
  styles: [],
})
export class EntrarBairroComponent {
  @Input() loading = false;
  @Output() codeSubmitted = new EventEmitter<string>();
  @Output() previousStep = new EventEmitter<void>();

  codigo = '';

  onSubmit(): void {
    if (!this.codigo.trim() || this.loading) return;

    this.codeSubmitted.emit(this.codigo.trim());
  }
}
