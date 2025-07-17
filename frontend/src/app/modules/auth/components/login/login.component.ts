import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { PwaInstallDialogService } from '../../../../shared/components/pwa-install-dialog/pwa-install-dialog.service';
import { LoginDto, LoginSchema } from '../../../../shared/schemas/user.schema';
import { GlobalDialogService } from '../../../../shared/services/global-dialog.service';
import { AuthService } from '../../services/auth.service';
import { PasswordRecoveryDialogComponent } from './password-recovery-dialog/password-recovery-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    PasswordRecoveryDialogComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPasswordRecoveryDialog = false;
  recoveryEmail = '';

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private globalDialogService: GlobalDialogService,
    private router: Router,
    private pwaInstallDialogService: PwaInstallDialogService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.pwaInstallDialogService.show();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const loginData: LoginDto = this.loginForm.value;

      // Validate with Zod
      const validation = LoginSchema.safeParse(loginData);
      if (!validation.success) {
        this.globalDialogService.showError('Dados inválidos', 'Verifique os dados informados');
        this.isLoading = false;
        return;
      }

      this.authService.login(validation.data).subscribe({
        next: (response) => {
          const user = response.user;
          if (user.bairro && user.cidade && user.estado) {
            this.router.navigate(['/jogos']);
          } else {
            this.router.navigate(['/onboarding']);
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          this.isLoading = false;

          // Verificar se é erro de email não verificado
          if (error.status === 401 && error.error?.message?.includes('Email não verificado')) {
            // Abrir dialog de recuperação/verificação com o email preenchido
            this.recoveryEmail = validation.data.email;
            this.showPasswordRecoveryDialog = true;
            return;
          }

          // Outros erros
          this.globalDialogService.showError(
            'Erro ao fazer login',
            error.error?.message || 'Verifique suas credenciais'
          );
        },
      });
    } else {
      this.globalDialogService.showWarning(
        'Campos obrigatórios',
        'Preencha todos os campos obrigatórios'
      );
    }
  }

  onRegisterClick(): void {
    this.router.navigate(['/auth/register']);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} é obrigatório`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${
          field.errors['minlength'].requiredLength
        } caracteres`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      email: 'Email',
      password: 'Senha',
    };
    return labels[fieldName] || fieldName;
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  navigateToRecovery(): void {
    this.recoveryEmail = this.loginForm.get('email')?.value || '';
    this.showPasswordRecoveryDialog = true;
  }

  onPasswordRecoveryDialogClose(): void {
    this.showPasswordRecoveryDialog = false;
    this.recoveryEmail = '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters for form validation
  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }
}
