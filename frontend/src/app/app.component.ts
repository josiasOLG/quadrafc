import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { AuthService } from './modules/auth/services/auth.service';
import { GlobalDialogComponent } from './shared/components/error-dialog/error-dialog.component';
import { SnackbarContainerComponent } from './shared/components/snackbar-container/snackbar-container.component';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    ToastModule,
    SplashScreenComponent,
    SnackbarContainerComponent,
    GlobalDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'QuadraFC';
  private isAppReady = false;

  constructor(public authService: AuthService) {
    // Adicionar um delay maior para garantir estabilidade completa
    setTimeout(() => {
      this.isAppReady = true;
    }, 200);
  }

  /**
   * Verifica se o AuthService está completamente pronto E se o app passou do delay inicial
   */
  isAuthServiceReady(): boolean {
    if (!this.isAppReady) return false;

    const isInitialized = this.authService.isInitialized();
    const authState = this.authService.authState();

    // Só considera "pronto" se está inicializado E o estado não é transitório
    // Adicionalmente, garantir que se há um usuário, ele existe de fato
    const isStateStable = authState !== 'INITIAL' && authState !== 'LOADING';

    if (!isInitialized || !isStateStable) {
      return false;
    }

    // Se está autenticado, garantir que o usuário está definido
    const isAuthenticated = authState === 'AUTHENTICATED' || authState === 'NEEDS_ONBOARDING';
    if (isAuthenticated) {
      return this.authService.currentUser() !== null;
    }

    // Se não autenticado, não precisa de usuário
    return true;
  }
}
