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
    console.log('AuthGuard: isAuthenticated:', this.authService.isAuthenticated);
    console.log('AuthGuard: currentUser:', this.authService.currentUser);

    // Debug do localStorage
    console.log('AuthGuard: localStorage auth:', localStorage.getItem('quadrafc_admin_auth'));
    console.log(
      'AuthGuard: localStorage user exists:',
      !!localStorage.getItem('quadrafc_admin_user')
    );

    // Se não está autenticado mas há dados salvos, tentar recarregar
    if (!this.authService.isAuthenticated && this.authService.hasStoredAuthData()) {
      console.log('AuthGuard: Dados encontrados no storage, tentando recarregar...');
      this.authService.reloadAuthData();

      // Verificar novamente após recarregar
      if (this.authService.isAuthenticated) {
        console.log('AuthGuard: Dados recarregados com sucesso, permitindo acesso');
        return true;
      }
    }

    if (this.authService.isAuthenticated) {
      console.log('AuthGuard: Usuário autenticado, permitindo acesso');
      return true;
    }

    console.log('AuthGuard: Usuário não autenticado, redirecionando para login');
    // Redirecionar para login se não autenticado
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
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
    console.log('AdminGuard: isAuthenticated:', this.authService.isAuthenticated);
    console.log('AdminGuard: isAdmin:', this.authService.isAdmin);
    console.log('AdminGuard: currentUser:', this.authService.currentUser);

    // Se não está autenticado mas há dados salvos, tentar recarregar
    if (!this.authService.isAuthenticated && this.authService.hasStoredAuthData()) {
      console.log('AdminGuard: Dados encontrados no storage, tentando recarregar...');
      this.authService.reloadAuthData();
    }

    if (this.authService.isAuthenticated && this.authService.isAdmin) {
      console.log('AdminGuard: Usuário é admin, permitindo acesso');
      return true;
    }

    console.log('AdminGuard: Usuário não é admin, redirecionando para login');
    // Redirecionar para login ou página de acesso negado
    this.router.navigate(['/login']);
    return false;
  }
}
