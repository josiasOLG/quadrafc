import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { GlobalDialogService } from '../../../../shared/services/global-dialog.service';
import { UserService } from '../../../../shared/services/user.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CompartilharBairroService } from '../../services/compartilhar-bairro.service';

// Componentes filhos
import { UserMiniHeaderComponent } from '../../../../shared/components/user-mini-header/user-mini-header.component';
import { EntrarBairroComponent } from './entrar-bairro/entrar-bairro.component';
import { MostrarCodigoComponent } from './mostrar-codigo/mostrar-codigo.component';
import { StepIndicatorComponent } from './step-indicator/step-indicator.component';

@Component({
  selector: 'app-compartilhar-bairro',
  standalone: true,
  imports: [
    CommonModule,
    StepIndicatorComponent,
    MostrarCodigoComponent,
    EntrarBairroComponent,
    UserMiniHeaderComponent,
  ],
  templateUrl: './compartilhar-bairro.component.html',
  styleUrls: ['./compartilhar-bairro.component.scss'],
})
export class CompartilharBairroComponent implements OnInit {
  currentStep = 1;
  userCode = '';
  loading = false;
  submitting = false;

  constructor(
    private globalDialogService: GlobalDialogService,
    private authService: AuthService,
    private userService: UserService,
    private compartilharBairroService: CompartilharBairroService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserCode();
  }

  private loadUserCode(): void {
    this.loading = true;

    this.userService
      .getProfile()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (user) => {
          this.userCode = user.code || '';
        },
        error: () => {
          this.globalDialogService.showError('Erro', 'Não foi possível carregar seus dados');
        },
      });
  }

  goToNextStep(): void {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  goToPreviousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onCodeSubmitted(codigo: string): void {
    this.submitting = true;

    this.compartilharBairroService
      .entrarEmBairro(codigo)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.showLogoutDialog();
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'Erro ao entrar no bairro';
          this.globalDialogService.showError('Erro', errorMessage);
        },
      });
  }

  private showLogoutDialog(): void {
    this.globalDialogService.show({
      type: 'success',
      title: 'Sucesso!',
      message: 'Você entrou no bairro com sucesso!',
      details: 'Para que as mudanças tenham efeito, você precisa fazer login novamente.',
      closable: false,
      actions: [
        {
          label: 'Fazer Logout',
          action: () => {
            this.globalDialogService.hide();
            this.logout();
          },
          severity: 'primary',
          icon: 'pi pi-sign-out',
        },
      ],
    });
  }

  private logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
