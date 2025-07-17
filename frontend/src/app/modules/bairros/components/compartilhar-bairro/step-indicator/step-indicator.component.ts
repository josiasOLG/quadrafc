import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule, StepsModule, ButtonModule],
  template: `
    <div class="flex flex-column gap-3">
      <p-steps [activeIndex]="activeIndex" [model]="items" [readonly]="true" />
    </div>
  `,
  styleUrls: ['./step-indicator.component.scss'],
})
export class StepIndicatorComponent {
  @Input() currentStep = 1;
  @Input() totalSteps = 2;

  get activeIndex(): number {
    return this.currentStep - 1;
  }

  get items(): MenuItem[] {
    return [{ label: 'Meu Código' }, { label: 'Entrar em Bairro' }];
  }

  onStepClick(): void {
    // Método para permitir navegação entre steps se necessário
    // Por enquanto não faz nada, apenas para evitar erro no template
  }
}
