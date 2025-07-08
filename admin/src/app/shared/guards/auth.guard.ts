import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log('AuthGuard: Verificando autenticação para:', state.url);

    // Evitar loop infinito verificando se já estamos na página de login
    if (state.url === '/login') {
      return true;
    }

    // Se não está autenticado mas há dados salvos, tentar recarregar UMA vez apenas
    if (!this.authService.isAuthenticated && this.authService.hasStoredAuthData()) {
      console.log('AuthGuard: Dados encontrados no storage, tentando recarregar...');
      this.authService.reloadAuthData();
    }

    if (this.authService.isAuthenticated) {
      console.log('AuthGuard: Usuário autenticado, permitindo acesso');
      return true;
    }

    console.log('AuthGuard: Usuário não autenticado, redirecionando para login');
    // Usar replace para evitar loop de navegação
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
      replaceUrl: true,
    });
    return false;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log('AdminGuard: Verificando permissões de admin para:', state.url);

    // Evitar loop infinito verificando se já estamos na página de login
    if (state.url === '/login') {
      return true;
    }

    // Se não está autenticado mas há dados salvos, tentar recarregar UMA vez apenas
    if (!this.authService.isAuthenticated && this.authService.hasStoredAuthData()) {
      console.log('AdminGuard: Dados encontrados no storage, tentando recarregar...');
      this.authService.reloadAuthData();
    }

    if (this.authService.isAuthenticated && this.authService.isAdmin) {
      console.log('AdminGuard: Usuário é admin, permitindo acesso');
      return true;
    }

    console.log('AdminGuard: Usuário não é admin, redirecionando para login');
    // Usar replace para evitar loop de navegação
    this.router.navigate(['/login'], { replaceUrl: true });
    return false;
  }
}
