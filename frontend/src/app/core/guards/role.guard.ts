import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleService, Permission, UserRole } from './roles.config';
import { map } from 'rxjs/operators';

// Factory function para criar guard com permissões específicas
export function createRoleGuard(requiredPermissions: Permission | Permission[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
      map(user => {
        if (!user) {
          router.navigate(['/auth/login']);
          return false;
        }

        const userRole = authService.userRole;
        const hasAccess = RoleService.canAccess(userRole, requiredPermissions);

        if (!hasAccess) {
          router.navigate(['/access-denied']);
          return false;
        }

        return true;
      })
    );
  };
}

// Guards pré-definidos para casos comuns
export const adminGuard: CanActivateFn = createRoleGuard([
  { action: 'view', resource: 'admin' }
]);

export const moderatorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }

      const userRole = authService.userRole;
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR) {
        router.navigate(['/access-denied']);
        return false;
      }

      return true;
    })
  );
};

// Guard genérico baseado em dados da rota
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Pega as permissões necessárias dos dados da rota
  const requiredPermissions = route.data?.['permissions'] as Permission | Permission[];
  const requiredRole = route.data?.['role'] as UserRole;

  return authService.currentUser$.pipe(
    map(user => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }

      const userRole = authService.userRole;

      // Verifica role específica se definida
      if (requiredRole && userRole !== requiredRole && userRole !== UserRole.ADMIN) {
        router.navigate(['/access-denied']);
        return false;
      }

      // Verifica permissões se definidas
      if (requiredPermissions) {
        const hasAccess = RoleService.canAccess(userRole, requiredPermissions);
        if (!hasAccess) {
          router.navigate(['/access-denied']);
          return false;
        }
      }

      return true;
    })
  );
};
