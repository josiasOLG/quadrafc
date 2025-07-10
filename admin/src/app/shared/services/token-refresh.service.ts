import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService implements OnDestroy {
  private refreshSubscription?: Subscription;
  private readonly CHECK_INTERVAL = 60000; // Verificar a cada 1 minuto
  private readonly MINIMUM_VALID_TIME = 300; // 5 minutos em segundos

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Inicia o monitoramento do token JWT para renovação automática
   */
  startTokenRefreshMonitoring(): void {
    // Cancelar qualquer monitoramento existente
    this.stopTokenRefreshMonitoring();

    // Iniciar novo monitoramento apenas se o usuário estiver autenticado
    if (this.authService.isAuthenticated) {
      console.log('TokenRefreshService: Iniciando monitoramento do token JWT');

      this.refreshSubscription = interval(this.CHECK_INTERVAL).subscribe(() => {
        if (this.authService.isAuthenticated) {
          this.authService.checkAndRenewTokenIfNeeded(this.MINIMUM_VALID_TIME);
        } else {
          // Se não estiver mais autenticado, parar monitoramento
          this.stopTokenRefreshMonitoring();
        }
      });

      // Verificar imediatamente na primeira vez
      this.authService.checkAndRenewTokenIfNeeded(this.MINIMUM_VALID_TIME);
    }
  }

  /**
   * Para o monitoramento do token JWT
   */
  stopTokenRefreshMonitoring(): void {
    if (this.refreshSubscription) {
      console.log('TokenRefreshService: Parando monitoramento do token JWT');
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopTokenRefreshMonitoring();
  }
}
