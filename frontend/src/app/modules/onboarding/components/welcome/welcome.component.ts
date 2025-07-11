import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  firstValueFrom,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { StepsModule } from 'primeng/steps';

import { CepResponse, CepService } from '../../../../core/services/cep.service';
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
    InputGroupModule,
    InputGroupAddonModule,
    DropdownModule,
  ],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentStep = 0;
  onboardingForm: FormGroup;
  bairros: Bairro[] = [];
  filteredBairros: Bairro[] = [];
  bairrosSugeridos: string[] = [];
  bairrosDisponiveis: { nome: string; id: string }[] = [];
  cepData: CepResponse | null = null;
  isLoading = false;
  isLoadingCep = false;
  showBairroSelect = false;
  showBairroInput = false;
  cepError = '';
  bairroError = '';
  isValidatingBairro = false;
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
    private bairrosService: BairrosService,
    private cepService: CepService
  ) {
    this.onboardingForm = this.fb.group({
      data_nascimento: ['', Validators.required],
      telefone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
      cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      bairro: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Se já tem informações completas, redireciona para ranking
    const user = this.authService.currentUser();
    if (user && user.bairro && user.cidade && user.estado) {
      this.router.navigate(['/ranking']);
      return;
    }

    // Listener para mudanças no CEP com debounce
    this.onboardingForm
      .get('cep')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        debounceTime(800), // Aguarda 800ms após parar de digitar
        distinctUntilChanged(), // Só emite se o valor mudou
        switchMap((cep: string) => {
          // Limpa estados anteriores
          this.resetCepState();

          // Valida se CEP está completo
          if (!cep || cep.length < 9) {
            return EMPTY; // Não faz nada se CEP incompleto
          }

          // Valida formato do CEP
          const cepLimpo = cep.replace(/\D/g, '');
          if (cepLimpo.length !== 8) {
            this.cepError = 'CEP deve ter 8 dígitos';
            return EMPTY;
          }

          // Inicia loading e busca CEP
          this.isLoadingCep = true;
          return this.cepService.buscarCep(cep).pipe(
            // Captura erros e os trata sem quebrar o stream principal
            catchError((error: any) => {
              this.handleCepError(error);
              return EMPTY; // Retorna EMPTY para não quebrar o fluxo
            })
          );
        })
      )
      .subscribe({
        next: (response: CepResponse) => this.handleCepResponse(response),
        // Removemos o error handler aqui pois agora é tratado no catchError
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetCepState(): void {
    this.cepData = null;
    this.bairrosSugeridos = [];
    this.bairrosDisponiveis = [];
    this.cepError = '';
    this.bairroError = '';
    this.onboardingForm.patchValue({ bairro: '' });
  }

  private handleCepResponse(response: CepResponse): void {
    this.cepData = response;
    this.isLoadingCep = false; // Resetar loading no sucesso

    // Se o CEP tem bairro, preencher automaticamente e tornar readonly
    if (response.bairro && response.bairro.trim()) {
      this.onboardingForm.patchValue({
        bairro: response.bairro.trim(),
      });

      this.toastService.show({
        detail: `Endereço encontrado: ${response.bairro}, ${response.localidade}/${response.uf}`,
        severity: 'success',
      });
    }
    // Se não tem bairro no CEP, habilitar input para digitação
    else {
      this.onboardingForm.patchValue({ bairro: '' }); // Limpar o campo

      this.toastService.show({
        detail: `Endereço encontrado em ${response.localidade}/${response.uf}. Digite o nome do seu bairro.`,
        severity: 'info',
      });
    }
  }

  private handleCepError(error: any): void {
    this.isLoadingCep = false;

    if (error.status === 404) {
      this.cepError = 'CEP não encontrado';
      this.toastService.show({
        detail: 'CEP não encontrado. Verifique se digitou corretamente',
        severity: 'error',
      });
    } else {
      this.cepError = 'Erro ao buscar CEP';
      this.toastService.show({
        detail: 'Erro ao buscar CEP. Tente novamente',
        severity: 'error',
      });
    }
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
        const cepControl = this.onboardingForm.get('cep');
        const bairroControl = this.onboardingForm.get('bairro');

        if (!cepControl?.valid) {
          this.toastService.show({
            detail: 'Por favor, insira um CEP válido',
            severity: 'warn',
          });
          return false;
        }

        if (!this.cepData) {
          this.toastService.show({
            detail: 'Por favor, aguarde a validação do CEP',
            severity: 'warn',
          });
          return false;
        }

        // Se tem bairro direto do CEP, está tudo ok
        if (this.hasBairroFromCep()) {
          return true;
        }

        // Se não tem bairro direto do CEP, precisa ter digitado um válido
        if (!bairroControl?.value || bairroControl.value.trim().length < 2) {
          this.toastService.show({
            detail: 'Por favor, digite o nome do seu bairro (mínimo 2 caracteres)',
            severity: 'warn',
          });
          return false;
        }
        break;
    }
    return true;
  }

  async completeOnboarding(): Promise<void> {
    if (this.onboardingForm.valid && this.cepData) {
      this.isLoading = true;

      try {
        const formData = this.onboardingForm.value;

        // Preparar dados para envio - usar sempre o valor do formulário
        const updateData: any = {
          data_nascimento: formData.data_nascimento,
          telefone: formData.telefone,
          cep: formData.cep,
          cidade: this.cepData.localidade,
          estado: this.cepData.uf,
          pais: 'Brasil',
          bairro: formData.bairro?.trim(), // Usar o valor do formulário
        };

        await firstValueFrom(this.authService.updateProfile(updateData));

        this.toastService.show({
          detail: 'Bem-vindo ao QuadraFC!',
          severity: 'success',
        });

        // Aguardar um pouco para garantir que o estado foi atualizado
        await new Promise((resolve) => setTimeout(resolve, 500));

        this.router.navigate(['/jogos']);
      } catch {
        this.toastService.show({
          detail: 'Erro ao completar cadastro',
          severity: 'error',
        });
      } finally {
        this.isLoading = false;
      }
    }
  }

  getBairroDisplayName(bairro: Bairro): string {
    return `${bairro.nome} - ${bairro.cidade}/${bairro.estado}`;
  }

  getBairroNome(): string {
    const bairroValue = this.onboardingForm.get('bairro')?.value;
    if (bairroValue && bairroValue.trim()) {
      return bairroValue.trim();
    }
    if (this.cepData?.bairro) {
      return this.cepData.bairro;
    }
    return 'seu bairro';
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
        const cepValid = this.onboardingForm.get('cep')?.valid;
        const hasCepData = this.cepData !== null;
        const bairroControl = this.onboardingForm.get('bairro');

        if (!cepValid || !hasCepData) {
          return false;
        }

        // Se tem bairro direto do CEP (campo desabilitado)
        if (this.hasBairroFromCep()) {
          return true; // Sempre válido quando vem do CEP
        }

        // Se não tem bairro do CEP, precisa ter digitado um válido
        return (
          bairroControl?.valid && bairroControl?.value && bairroControl.value.trim().length >= 2
        );
      case 3:
        return this.onboardingForm.valid && this.cepData !== null;
      default:
        return false;
    }
  }

  // Método utilitário para verificar se CEP é válido
  isCepValid(cep: string): boolean {
    if (!cep) return false;
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.length === 8;
  }

  // Método para formatar mensagens de erro do CEP
  getCepErrorMessage(): string {
    return this.cepError;
  }

  // Método para verificar se deve mostrar o loading do CEP
  shouldShowCepLoading(): boolean {
    const cepControl = this.onboardingForm.get('cep');
    return this.isLoadingCep && cepControl?.value && this.isCepValid(cepControl.value);
  }

  // Método para obter classe CSS do input CEP
  getCepInputClass(): string {
    const cepControl = this.onboardingForm.get('cep');
    const isInvalid = cepControl?.invalid && cepControl?.touched;
    const hasError = this.cepError && !this.isLoadingCep;
    const hasSuccess = this.cepData && !this.isLoadingCep;

    if (isInvalid || hasError) {
      return 'p-invalid';
    } else if (hasSuccess) {
      return 'p-valid';
    }
    return '';
  }

  // Método para obter o status do CEP
  getCepStatus(): 'loading' | 'success' | 'error' | 'idle' {
    if (this.isLoadingCep) return 'loading';
    if (this.cepData) return 'success';
    if (this.cepError) return 'error';
    return 'idle';
  }

  // Método para debug - verificar se os bairros sugeridos estão sendo recebidos
  getBairrosSugeridosCount(): number {
    return this.bairrosSugeridos.length;
  }

  // Método para verificar se o bairro vem do endpoint do CEP
  hasBairroFromCep(): boolean {
    return !!(this.cepData?.bairro && this.cepData.bairro.trim());
  }

  // Listener para mudanças no input do bairro
  onBairroInputChange(): void {
    const bairroControl = this.onboardingForm.get('bairro');
    if (bairroControl?.value && !this.hasBairroFromCep()) {
      // Debounce para não validar a cada tecla
      setTimeout(() => {
        if (bairroControl.value === bairroControl.value) {
          // Verifica se não mudou
          this.validateBairroInput(bairroControl.value);
        }
      }, 1000);
    }
  }

  // Método para validar bairro digitado pelo usuário
  async validateBairroInput(nomeBairro: string): Promise<void> {
    if (!nomeBairro || !this.cepData || nomeBairro.trim().length < 2) {
      this.bairroError = '';
      return;
    }

    this.isValidatingBairro = true;
    this.bairroError = '';

    try {
      const validation = await firstValueFrom(
        this.cepService.validarNovoBairro(
          nomeBairro.trim(),
          this.cepData.localidade,
          this.cepData.uf
        )
      );

      if (!validation?.valido && validation?.sugestoes && validation.sugestoes.length > 0) {
        this.bairroError = `Bairros similares encontrados: ${validation.sugestoes.join(
          ', '
        )}. Use um deles ou confirme se está correto.`;
        this.toastService.show({
          detail: `Encontramos bairros similares. Verifique se não é um deles: ${validation.sugestoes.join(
            ', '
          )}`,
          severity: 'warn',
        });
      }
    } catch {
      // Não bloquear se der erro na validação
    } finally {
      this.isValidatingBairro = false;
    }
  }
}
