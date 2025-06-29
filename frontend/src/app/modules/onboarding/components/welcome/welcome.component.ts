import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { StepsModule } from 'primeng/steps';

import { Bairro } from '../../../../shared/schemas/bairro.schema';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';
import { BairrosService } from '../../../bairros/services/bairros.service';

interface OnboardingStep {
  label: string;
  step: number;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    AutoCompleteModule,
    StepsModule,
    CardModule,
    CalendarModule,
    InputMaskModule,
  ],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit {
  currentStep = 0;
  onboardingForm: FormGroup;
  bairros: Bairro[] = [];
  filteredBairros: Bairro[] = [];
  isLoading = false;
  maxDate = new Date(); // Data máxima para nascimento (hoje)

  steps: OnboardingStep[] = [
    { label: 'Bem-vindo', step: 0 },
    { label: 'Informações Pessoais', step: 1 },
    { label: 'Localização', step: 2 },
    { label: 'Pronto!', step: 3 },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService,
    private bairrosService: BairrosService
  ) {
    this.onboardingForm = this.fb.group({
      data_nascimento: ['', Validators.required],
      telefone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
      bairro: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Se já tem bairro e bairroId, redireciona para ranking
    const user = this.authService.currentUser;
    if (user && user.bairro && user.bairroId) {
      this.router.navigate(['/ranking']);
      return;
    }
    this.loadBairros();
  }

  loadBairros(): void {
    this.bairrosService.getAll().subscribe({
      next: (response) => {
        this.bairros = response.data || [];
      },
      error: (error) => {
        console.error('Erro ao carregar bairros:', error);
        this.toastService.show({ detail: 'Erro ao carregar bairros', severity: 'error' });
      },
    });
  }

  filterBairros(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredBairros = this.bairros.filter(
      (bairro) =>
        bairro.nome.toLowerCase().includes(query) ||
        bairro.cidade.toLowerCase().includes(query) ||
        bairro.estado.toLowerCase().includes(query)
    );
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    } else {
      this.completeOnboarding();
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }
  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        const dataControl = this.onboardingForm.get('data_nascimento');
        const telefoneControl = this.onboardingForm.get('telefone');

        if (!dataControl?.valid) {
          this.toastService.show({
            detail: 'Por favor, insira sua data de nascimento',
            severity: 'warn',
          });
          return false;
        }
        if (!telefoneControl?.valid) {
          this.toastService.show({
            detail: 'Por favor, insira um telefone válido',
            severity: 'warn',
          });
          return false;
        }
        break;
      case 2:
        const bairroControl = this.onboardingForm.get('bairro');
        if (!bairroControl?.valid) {
          this.toastService.show({ detail: 'Por favor, selecione seu bairro', severity: 'warn' });
          return false;
        }
        break;
    }
    return true;
  }

  async completeOnboarding(): Promise<void> {
    if (this.onboardingForm.valid) {
      this.isLoading = true;
      try {
        const formData = this.onboardingForm.value;

        await this.authService
          .updateProfile({
            data_nascimento: formData.data_nascimento,
            telefone: formData.telefone,
            bairro: formData.bairro.id || formData.bairro._id,
          })
          .toPromise();

        this.toastService.show({ detail: 'Bem-vindo ao QuadraFC!', severity: 'success' });
        this.router.navigate(['/jogos']);
      } catch (error) {
        console.error('Erro ao completar onboarding:', error);
        this.toastService.show({ detail: 'Erro ao completar cadastro', severity: 'error' });
      } finally {
        this.isLoading = false;
      }
    }
  }

  getBairroDisplayName(bairro: Bairro): string {
    return `${bairro.nome} - ${bairro.cidade}/${bairro.estado}`;
  }

  trackByStep(index: number, item: OnboardingStep): number {
    return item.step;
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 0:
        return true;
      case 1:
        return (
          (this.onboardingForm.get('data_nascimento')?.valid &&
            this.onboardingForm.get('telefone')?.valid) ||
          false
        );
      case 2:
        return this.onboardingForm.get('bairro')?.valid || false;
      case 3:
        return this.onboardingForm.valid;
      default:
        return false;
    }
  }
}
