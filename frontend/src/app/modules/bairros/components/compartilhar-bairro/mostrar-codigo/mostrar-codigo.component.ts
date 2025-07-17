import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { GlobalDialogService } from '../../../../../shared/services/global-dialog.service';

@Component({
  selector: 'app-mostrar-codigo',
  standalone: true,
  imports: [CommonModule, ButtonModule, SkeletonModule, CardModule],
  template: `
    <p-card>
      <div class="text-center">
        <h2 class="text-xl font-semibold mb-2">Compartilhe seu Código</h2>
        <p class="text-color-secondary line-height-3">
          Envie este código para seus amigos entrarem no seu bairro e participarem dos rankings
          locais
        </p>

        <div *ngIf="!loading; else loadingTemplate">
          <div
            class="flex align-items-center justify-content-center gap-2 p-3 border-round surface-50 border-1 surface-border"
            *ngIf="userCode"
          >
            <span class="font-mono text-primary font-semibold text-lg">{{ userCode }}</span>
            <p-button
              icon="pi pi-copy"
              [rounded]="true"
              [outlined]="true"
              size="small"
              [disabled]="!userCode"
              (onClick)="copyCode()"
              pTooltip="Copiar código"
              tooltipPosition="top"
            >
            </p-button>
          </div>
        </div>

        <ng-template #loadingTemplate>
          <div class="flex flex-column align-items-center gap-2">
            <p-skeleton width="150px" height="30px" borderRadius="8px"></p-skeleton>
            <p-skeleton width="40px" height="40px" borderRadius="8px"></p-skeleton>
            <p class="mt-2 text-color-secondary">Carregando seu código...</p>
          </div>
        </ng-template>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-content-end">
          <p-button
            label="Entrar no Bairro"
            icon="pi pi-arrow-right"
            iconPos="right"
            (onClick)="nextStep.emit()"
          >
          </p-button>
        </div>
      </ng-template>
    </p-card>
  `,
  styles: [],
})
export class MostrarCodigoComponent {
  @Input() userCode = '';
  @Input() loading = false;
  @Output() nextStep = new EventEmitter<void>();

  constructor(private globalDialogService: GlobalDialogService) {}

  async copyCode(): Promise<void> {
    if (!this.userCode) return;

    try {
      await navigator.clipboard.writeText(this.userCode);
      this.globalDialogService.showSuccess(
        'Sucesso',
        'Código copiado para a área de transferência!'
      );
    } catch {
      this.globalDialogService.showError('Erro', 'Não foi possível copiar o código');
    }
  }
}
