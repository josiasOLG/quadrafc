import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';

import { LoginSchema } from '../../shared/models/auth.model';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  returnUrl = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit() {
    // Verificar se já está logado
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
      return;
    }

    // Obter URL de retorno
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  createForm(): FormGroup {
    return this.fb.group({
      email: ['admin@quadrafc.com', [Validators.required, Validators.email]],
      password: ['admin123', [Validators.required]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      const formData = this.loginForm.value;

      try {
        // Validação com Zod
        const validatedData = LoginSchema.parse(formData);

        this.authService.login(validatedData).subscribe({
          next: (response) => {
            this.loading = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Login realizado com sucesso',
            });

            // Redirecionar imediatamente
            console.log('Navegando para:', this.returnUrl);
            console.log('Dados do usuário após login:', this.authService.currentUser);

            // Forçar uma pequena pausa para garantir que o estado foi atualizado
            setTimeout(() => {
              this.router.navigate([this.returnUrl]).then(
                (success) => {
                  console.log('Navegação bem-sucedida:', success);
                  if (!success) {
                    console.log('Navegação falhou, tentando rota padrão');
                    // Tentar navegação absoluta
                    window.location.href = '/dashboard';
                  }
                },
                (error) => console.error('Erro na navegação:', error)
              );
            }, 100);
          },
          error: (error) => {
            console.error('Erro no login:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: error.error?.message || 'Credenciais inválidas',
            });
            this.loading = false;
          },
        });
      } catch (zodError: any) {
        console.error('Erro de validação:', zodError);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro de Validação',
          detail: 'Dados inválidos. Verifique os campos.',
        });
        this.loading = false;
      }
    } else {
      this.markFormGroupTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos obrigatórios',
      });
    }
  }

  markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} é obrigatório`;
      if (field.errors['email']) return 'Email inválido';
    }
    return '';
  }
}
