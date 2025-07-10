import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { TokenRefreshService } from './shared/services/token-refresh.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'QuadraFC Admin';

  constructor(private authService: AuthService, private tokenRefreshService: TokenRefreshService) {}

  ngOnInit(): void {
    // Carregar dados do usuário se existirem no localStorage
    this.authService.reloadAuthData();

    // Iniciar monitoramento do token JWT se o usuário estiver autenticado
    if (this.authService.isAuthenticated) {
      this.tokenRefreshService.startTokenRefreshMonitoring();
    }

    // Ouvir mudanças no estado de autenticação para iniciar/parar monitoramento
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.tokenRefreshService.startTokenRefreshMonitoring();
      } else {
        this.tokenRefreshService.stopTokenRefreshMonitoring();
      }
    });
  }
}
