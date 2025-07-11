import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { JwtHelper } from '../utils/jwt-helper';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Evitar loop infinito verificando se já estamos na página de login
    if (state.url === '/login') {
      return true;
    }

    // Verificar se temos token JWT salvo
    const token = localStorage.getItem('quadrafc_admin_auth');

    // Se não há token, redirecionar para login
    if (!token) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
        replaceUrl: true,
      });
      return false;
    }

    // Se há token mas não está no serviço, recarregar dados
    if (token && !this.authService.token) {
      this.authService.reloadAuthData();
    }

    // Verificar se o token é válido
    if (token && JwtHelper.isTokenExpired(token)) {
      this.authService.logout();
      return false;
    }

    if (this.authService.isAuthenticated) {
      return true;
    }

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
    // Evitar loop infinito verificando se já estamos na página de login
    if (state.url === '/login') {
      return true;
    }

    // Verificar se temos token JWT salvo
    const token = localStorage.getItem('quadrafc_admin_auth');

    // Se não há token, redirecionar para login
    if (!token) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
        replaceUrl: true,
      });
      return false;
    }

    // Verificar se o token é válido
    if (token && JwtHelper.isTokenExpired(token)) {
      this.authService.logout();
      return false;
    }

    // Se há token mas não está no serviço, recarregar dados
    if (token && !this.authService.token) {
      this.authService.reloadAuthData();
    }

    if (this.authService.isAuthenticated && this.authService.isAdmin) {
      return true;
    }

    // Se está autenticado mas não é admin, vai para dashboard. Senão, vai para login
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
        replaceUrl: true,
      });
    }
    return false;
  }
}
