import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { AuthService } from './modules/auth/services/auth.service';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ToastModule, SplashScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'QuadraFC';
  private lastValidationTime = 0;
  private readonly VALIDATION_INTERVAL = 30 * 60 * 1000; // 30 minutos

  constructor(public authService: AuthService) {}

  // Escutar eventos de foco da janela/PWA para validar sessão
  @HostListener('window:focus', ['$event'])
  onWindowFocus() {
    console.log('PWA retornou ao foco - validando sessão se necessário...');
    this.validateSessionIfNeeded();
  }

  // Escutar eventos de visibilidade para PWA
  @HostListener('document:visibilitychange', ['$event'])
  onVisibilityChange() {
    if (!document.hidden) {
      console.log('PWA ficou visível - validando sessão se necessário...');
      this.validateSessionIfNeeded();
    }
  }

  private validateSessionIfNeeded() {
    const now = Date.now();

    // Só validar se passou do intervalo mínimo desde a última validação
    if (now - this.lastValidationTime > this.VALIDATION_INTERVAL) {
      this.lastValidationTime = now;

      if (this.authService.isLoggedIn) {
        // Verificar se os dados são muito antigos antes de validar
        const timestamp = localStorage.getItem('quadrafc_user_timestamp');
        if (timestamp) {
          const age = Date.now() - parseInt(timestamp);
          const maxAge = 60 * 60 * 1000; // 1 hora

          // Só validar se os dados são antigos
          if (age > maxAge) {
            this.authService.validateSession().subscribe({
              next: (isValid) => {
                if (isValid) {
                  console.log('Sessão validada com sucesso');
                } else {
                  console.log('Sessão inválida - usuário será deslogado');
                }
              },
              error: (error) => {
                console.error('Erro ao validar sessão:', error);
              },
            });
          } else {
            console.log('Dados de sessão são recentes, não precisa validar agora');
          }
        }
      }
    }
  }
}
