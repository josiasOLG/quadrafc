export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export interface Permission {
  action: string;
  resource: string;
}

export const PERMISSIONS = {
  // Usuários
  VIEW_USERS: { action: 'view', resource: 'users' },
  MANAGE_USERS: { action: 'manage', resource: 'users' },

  // Bairros
  VIEW_BAIRROS: { action: 'view', resource: 'bairros' },
  MANAGE_BAIRROS: { action: 'manage', resource: 'bairros' },

  // Jogos
  VIEW_JOGOS: { action: 'view', resource: 'jogos' },
  MANAGE_JOGOS: { action: 'manage', resource: 'jogos' },

  // Palpites
  CREATE_PALPITES: { action: 'create', resource: 'palpites' },
  VIEW_PALPITES: { action: 'view', resource: 'palpites' },

  // Rodadas
  VIEW_RODADAS: { action: 'view', resource: 'rodadas' },
  MANAGE_RODADAS: { action: 'manage', resource: 'rodadas' },

  // Rankings
  VIEW_RANKINGS: { action: 'view', resource: 'rankings' },

  // Loja
  VIEW_LOJA: { action: 'view', resource: 'loja' },
  PURCHASE_ITEMS: { action: 'purchase', resource: 'loja' },

  // Admin
  ADMIN_DASHBOARD: { action: 'view', resource: 'admin' },
  SYSTEM_SETTINGS: { action: 'manage', resource: 'system' }
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    PERMISSIONS.VIEW_BAIRROS,
    PERMISSIONS.VIEW_JOGOS,
    PERMISSIONS.CREATE_PALPITES,
    PERMISSIONS.VIEW_PALPITES,
    PERMISSIONS.VIEW_RODADAS,
    PERMISSIONS.VIEW_RANKINGS,
    PERMISSIONS.VIEW_LOJA,
    PERMISSIONS.PURCHASE_ITEMS
  ],

  [UserRole.MODERATOR]: [
    // Permissões de usuário
    PERMISSIONS.VIEW_BAIRROS,
    PERMISSIONS.VIEW_JOGOS,
    PERMISSIONS.CREATE_PALPITES,
    PERMISSIONS.VIEW_PALPITES,
    PERMISSIONS.VIEW_RODADAS,
    PERMISSIONS.VIEW_RANKINGS,
    PERMISSIONS.VIEW_LOJA,
    PERMISSIONS.PURCHASE_ITEMS,
    // Permissões adicionais de moderador
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_BAIRROS,
    PERMISSIONS.MANAGE_JOGOS,
    PERMISSIONS.MANAGE_RODADAS
  ],

  [UserRole.ADMIN]: [
    // Todas as permissões de moderador
    PERMISSIONS.VIEW_BAIRROS,
    PERMISSIONS.VIEW_JOGOS,
    PERMISSIONS.CREATE_PALPITES,
    PERMISSIONS.VIEW_PALPITES,
    PERMISSIONS.VIEW_RODADAS,
    PERMISSIONS.VIEW_RANKINGS,
    PERMISSIONS.VIEW_LOJA,
    PERMISSIONS.PURCHASE_ITEMS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_BAIRROS,
    PERMISSIONS.MANAGE_JOGOS,
    PERMISSIONS.MANAGE_RODADAS,
    // Permissões exclusivas de admin
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ADMIN_DASHBOARD,
    PERMISSIONS.SYSTEM_SETTINGS
  ]
};

export class RoleService {
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    return rolePermissions.some(p =>
      p.action === permission.action && p.resource === permission.resource
    );
  }

  static hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  static hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  static canAccess(userRole: UserRole, requiredPermissions: Permission | Permission[]): boolean {
    if (Array.isArray(requiredPermissions)) {
      return this.hasAnyPermission(userRole, requiredPermissions);
    }
    return this.hasPermission(userRole, requiredPermissions);
  }
}
