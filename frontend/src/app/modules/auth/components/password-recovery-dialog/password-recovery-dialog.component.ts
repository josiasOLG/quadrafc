import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { interval, Subject, takeUntil } from 'rxjs';

import { GlobalDialogService } from '../../../../shared/services/global-dialog.service';
import { EmailVerificationService } from '../../services/email-verification.service';

@Component({
  selector: 'app-password-recovery-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TabViewModule,
  ],
  templateUrl: './password-recovery-dialog.component.html',
  styleUrls: ['./password-recovery-dialog.component.scss'],
})
export class PasswordRecoveryDialogComponent implements OnInit, OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() email = '';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() dialogClose = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  activeTab = 0; // 0 = verificação, 1 = recuperação

  // Verificação de email
  verificationForm: FormGroup;
  isVerificationLoading = false;
  isReenvioLoading = false;
  codigoEnviado = false;
  tempoReenvio = 0;
  podeReenviar = true;

  // Recuperação de senha
  recoveryForm: FormGroup;
  isRecoveryLoading = false;

  constructor(
    private fb: FormBuilder,
    private emailVerificationService: EmailVerificationService,
    private globalDialogService: GlobalDialogService
  ) {
    this.verificationForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });

    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    // Watch for visible changes
    if (this.visible && this.email) {
      this.setupVerificationFlow();
    }
  }

  ngOnChanges(): void {
    // Watch for changes in visible and email inputs
    if (this.visible && this.email) {
      this.setupVerificationFlow();
    }
  }

  private setupVerificationFlow(): void {
    this.recoveryForm.patchValue({ email: this.email });
    this.activeTab = 0; // Começar na aba de verificação

    // Reset forms and states
    this.resetForms();

    // Automatically try to send code when dialog opens
    setTimeout(() => {
      this.verificarStatusEmail();
    }, 500); // Small delay to ensure dialog is fully opened
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDialogHide(): void {
    this.closeDialog();
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.dialogClose.emit();
    this.resetForms();
  }

  private resetForms(): void {
    this.verificationForm.reset();
    this.verificationForm.get('codigo')?.enable();

    this.recoveryForm.reset();
    this.recoveryForm.get('email')?.enable();

    this.codigoEnviado = false;
    this.tempoReenvio = 0;
    this.podeReenviar = true;
    this.activeTab = this.email ? 0 : 1;
  }

  private updateFormStates(): void {
    // Control verification form state
    if (this.isVerificationLoading) {
      this.verificationForm.get('codigo')?.disable();
    } else {
      this.verificationForm.get('codigo')?.enable();
    }

    // Control recovery form state
    if (this.isRecoveryLoading) {
      this.recoveryForm.get('email')?.disable();
    } else {
      this.recoveryForm.get('email')?.enable();
    }
  }

  async verificarStatusEmail(): Promise<void> {
    if (!this.email) return;

    try {
      const status = await this.emailVerificationService
        .verificarStatusEmail(this.email)
        .toPromise();

      if (status?.emailVerificado) {
        this.globalDialogService.showSuccess(
          'Email já verificado!',
          'Seu email já está verificado. Você pode fechar esta janela.'
        );
        return;
      }

      if (!status?.temCodigoPendente || status?.codigoExpirado) {
        this.enviarCodigoVerificacao();
      } else {
        this.codigoEnviado = true;
        this.globalDialogService.showInfo(
          'Código pendente',
          'Já existe um código de verificação válido para este email.'
        );
      }
    } catch {
      this.enviarCodigoVerificacao();
    }
  }

  async enviarCodigoVerificacao(): Promise<void> {
    if (!this.email) return;

    this.isVerificationLoading = true;
    this.updateFormStates();

    try {
      const response = await this.emailVerificationService
        .enviarCodigoVerificacao(this.email)
        .toPromise();

      if (response?.success) {
        this.codigoEnviado = true;
        this.iniciarTempoReenvio();

        if (response.codigo) {
          this.globalDialogService.showSuccess(
            'Código enviado!',
            `Código: ${response.codigo} (desenvolvimento)`
          );
        } else {
          this.globalDialogService.showSuccess(
            'Código enviado!',
            'Verifique sua caixa de entrada.'
          );
        }
      }
    } catch (error: any) {
      this.globalDialogService.showError(
        'Erro ao enviar código',
        error.error?.message || 'Tente novamente'
      );
    } finally {
      this.isVerificationLoading = false;
      this.updateFormStates();
    }
  }

  async verificarCodigo(): Promise<void> {
    if (this.verificationForm.invalid) {
      this.globalDialogService.showWarning(
        'Código inválido',
        'Digite um código de 6 dígitos válido'
      );
      return;
    }

    this.isVerificationLoading = true;
    this.updateFormStates();
    const codigo = this.verificationForm.get('codigo')?.value;

    try {
      const response = await this.emailVerificationService
        .verificarCodigo(this.email, codigo)
        .toPromise();

      if (response?.success && response.emailVerificado) {
        this.globalDialogService.showSuccess(
          'Email verificado!',
          'Seu email foi verificado com sucesso.'
        );

        this.closeDialog();
      }
    } catch (error: any) {
      let errorMessage = 'Código inválido ou expirado';

      if (error.error?.message?.includes('expirado')) {
        errorMessage = 'Código expirado. Solicite um novo código.';
      } else if (error.error?.message?.includes('inválido')) {
        errorMessage = 'Código inválido. Verifique os dígitos.';
      }

      this.globalDialogService.showError('Erro na verificação', errorMessage);
      this.verificationForm.get('codigo')?.setValue('');
    } finally {
      this.isVerificationLoading = false;
      this.updateFormStates();
    }
  }

  async reenviarCodigo(): Promise<void> {
    if (!this.podeReenviar || !this.email) return;

    this.isReenvioLoading = true;

    try {
      const response = await this.emailVerificationService.reenviarCodigo(this.email).toPromise();

      if (response?.success) {
        this.iniciarTempoReenvio();
        this.verificationForm.get('codigo')?.setValue('');

        if (response.codigo) {
          this.globalDialogService.showSuccess(
            'Novo código enviado!',
            `Código: ${response.codigo} (desenvolvimento)`
          );
        } else {
          this.globalDialogService.showSuccess(
            'Novo código enviado!',
            'Verifique sua caixa de entrada.'
          );
        }
      }
    } catch (error: any) {
      this.globalDialogService.showError(
        'Erro ao reenviar código',
        error.error?.message || 'Tente novamente'
      );
    } finally {
      this.isReenvioLoading = false;
    }
  }

  async enviarRecuperacaoSenha(): Promise<void> {
    if (this.recoveryForm.invalid) {
      this.globalDialogService.showWarning('Email inválido', 'Digite um email válido');
      return;
    }

    this.isRecoveryLoading = true;
    this.updateFormStates();
    const email = this.recoveryForm.get('email')?.value;

    try {
      // TODO: Implementar serviço de recuperação de senha
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simular delay

      this.globalDialogService.showSuccess(
        'Email enviado!',
        `Instruções para recuperar sua senha foram enviadas para ${email}.`
      );

      this.recoveryForm.reset();
      this.closeDialog();
    } catch {
      this.globalDialogService.showError(
        'Erro ao enviar email',
        'Não foi possível enviar o email de recuperação. Tente novamente.'
      );
    } finally {
      this.isRecoveryLoading = false;
      this.updateFormStates();
    }
  }

  private iniciarTempoReenvio(): void {
    this.tempoReenvio = 60;
    this.podeReenviar = false;

    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.tempoReenvio--;
        if (this.tempoReenvio <= 0) {
          this.podeReenviar = true;
        }
      });
  }

  getCodigoError(): string {
    const codigoControl = this.verificationForm.get('codigo');
    if (codigoControl?.touched && codigoControl?.errors) {
      if (codigoControl.errors['required']) {
        return 'Código é obrigatório';
      }
      if (codigoControl.errors['pattern']) {
        return 'Código deve ter 6 dígitos';
      }
    }
    return '';
  }

  getEmailError(): string {
    const emailControl = this.recoveryForm.get('email');
    if (emailControl?.touched && emailControl?.errors) {
      if (emailControl.errors['required']) {
        return 'Email é obrigatório';
      }
      if (emailControl.errors['email']) {
        return 'Email inválido';
      }
    }
    return '';
  }
}
