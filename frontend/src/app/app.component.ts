import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ResolverLoadingInterceptor } from './core/interceptors/resolver-loading.interceptor';
import { AuthService } from './modules/auth/services/auth.service';
import { GlobalDialogComponent } from './shared/components/error-dialog/error-dialog.component';
import { PwaInstallDialogComponent } from './shared/components/pwa-install-dialog/pwa-install-dialog.component';
import { ResolverLoadingComponent } from './shared/components/resolver-loading/resolver-loading.component';
import { SnackbarContainerComponent } from './shared/components/snackbar-container/snackbar-container.component';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { AdvancedPwaService } from './shared/services/advanced-pwa.service';

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
    ResolverLoadingComponent,
    PwaInstallDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'QuadraFC';
  private isAppReady = false;

  constructor(
    public authService: AuthService,
    private resolverLoadingInterceptor: ResolverLoadingInterceptor,
    private advancedPwaService: AdvancedPwaService
  ) {
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

    const isStateStable = authState !== 'INITIAL' && authState !== 'LOADING';

    if (!isInitialized || !isStateStable) {
      return false;
    }

    const isAuthenticated = authState === 'AUTHENTICATED' || authState === 'NEEDS_ONBOARDING';
    if (isAuthenticated) {
      return this.authService.currentUser() !== null;
    }

    return true;
  }
}
