import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Subject, interval, takeUntil } from 'rxjs';
import { GlobalDialogService } from '../../../../../shared/services/global-dialog.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { EmailVerificationService } from '../../../../auth/services/email-verification.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss'],
})
export class EmailVerificationComponent implements OnInit, OnDestroy {
  @Input() email = '';
  @Output() emailVerificado = new EventEmitter<boolean>();
  @Output() voltar = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  verificationForm: FormGroup;
  isLoading = false;
  isReenvioLoading = false;
  codigoEnviado = false;
  tempoReenvio = 0;
  podeReenviar = true;

  constructor(
    private fb: FormBuilder,
    private emailVerificationService: EmailVerificationService,
    private globalDialogService: GlobalDialogService,
    private authService: AuthService
  ) {
    this.verificationForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  ngOnInit(): void {
    // Pegar email do usuário logado
    const user = this.authService.currentUser();
    if (user?.email) {
      this.email = user.email;
      this.verificarStatusEmail();
    } else if (this.email) {
      // Fallback para o email passado como input
      this.verificarStatusEmail();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async verificarStatusEmail(): Promise<void> {
    try {
      const status = await this.emailVerificationService
        .verificarStatusEmail(this.email)
        .toPromise();

      if (status?.emailVerificado) {
        this.emailVerificado.emit(true);
        return;
      }

      if (!status?.temCodigoPendente || status?.codigoExpirado) {
        this.enviarCodigo();
      } else {
        this.codigoEnviado = true;
        this.globalDialogService.showInfo(
          'Código pendente',
          'Já existe um código de verificação válido para este email. Verifique sua caixa de entrada.'
        );
      }
    } catch {
      this.enviarCodigo();
    }
  }

  async enviarCodigo(): Promise<void> {
    this.isLoading = true;

    try {
      const response = await this.emailVerificationService
        .enviarCodigoVerificacao(this.email)
        .toPromise();

      if (response?.success) {
        this.codigoEnviado = true;
        this.iniciarTempoReenvio();

        // Para desenvolvimento - mostrar o código
        if (response.codigo) {
          this.globalDialogService.showSuccess(
            'Código enviado!',
            `Código de verificação: ${response.codigo} (modo desenvolvimento)`
          );
        } else {
          this.globalDialogService.showSuccess(
            'Código enviado!',
            'Verifique sua caixa de entrada e digite o código de 6 dígitos.'
          );
        }
      }
    } catch (error: any) {
      this.globalDialogService.showError(
        'Erro ao enviar código',
        error.error?.message || 'Tente novamente em alguns instantes'
      );
    } finally {
      this.isLoading = false;
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

    this.isLoading = true;
    const codigo = this.verificationForm.get('codigo')?.value;

    try {
      const response = await this.emailVerificationService
        .verificarCodigo(this.email, codigo)
        .toPromise();

      if (response?.success && response?.emailVerificado) {
        this.globalDialogService.showSuccess(
          'Email verificado!',
          'Seu email foi verificado com sucesso. Vamos continuar com seu cadastro.'
        );
        this.emailVerificado.emit(true);
      } else {
        this.globalDialogService.showWarning(
          'Resposta inesperada',
          'Tente novamente ou solicite um novo código.'
        );
      }
    } catch (error: any) {
      let errorMessage = 'Código inválido ou expirado';

      if (error.error?.message?.includes('expirado')) {
        errorMessage = 'Código expirado. Solicite um novo código.';
      } else if (error.error?.message?.includes('inválido')) {
        errorMessage = 'Código inválido. Verifique os dígitos e tente novamente.';
      }

      this.globalDialogService.showError('Erro na verificação', errorMessage);
      this.verificationForm.get('codigo')?.setValue('');
    } finally {
      this.isLoading = false;
    }
  }

  async reenviarCodigo(): Promise<void> {
    if (!this.podeReenviar) return;

    this.isReenvioLoading = true;

    try {
      const response = await this.emailVerificationService.reenviarCodigo(this.email).toPromise();

      if (response?.success) {
        this.iniciarTempoReenvio();
        this.verificationForm.get('codigo')?.setValue('');

        // Para desenvolvimento - mostrar o código
        if (response.codigo) {
          this.globalDialogService.showSuccess(
            'Novo código enviado!',
            `Código: ${response.codigo} (modo desenvolvimento)`
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
        error.error?.message || 'Tente novamente em alguns instantes'
      );
    } finally {
      this.isReenvioLoading = false;
    }
  }

  private iniciarTempoReenvio(): void {
    this.tempoReenvio = 60; // 60 segundos
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

  onVoltarClick(): void {
    this.voltar.emit();
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
}
