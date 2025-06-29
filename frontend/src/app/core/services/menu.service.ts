import { Permission, PERMISSIONS, UserRole } from '../guards/roles.config';

export interface MenuItem {
  label?: string;
  icon?: string;
  routerLink?: string;
  command?: () => void;
  items?: MenuItem[];
  permissions?: Permission[];
  roles?: UserRole[];
  visible?: boolean;
  disabled?: boolean;
  badge?: string;
  badgeStyleClass?: string;
  separator?: boolean;
  expanded?: boolean;
}

export class MenuService {
  static getMenuItems(): MenuItem[] {
    return [
      {
        label: 'Jogos',
        icon: 'pi pi-calendar',
        items: [
          {
            label: 'Próximos Jogos',
            icon: 'pi pi-clock',
            routerLink: '/jogos/proximos',
            permissions: [PERMISSIONS.VIEW_JOGOS]
          },
          {
            label: 'Resultados',
            icon: 'pi pi-check-circle',
            routerLink: '/jogos/resultados',
            permissions: [PERMISSIONS.VIEW_JOGOS]
          },
          {
            label: 'Gerenciar Jogos',
            icon: 'pi pi-cog',
            routerLink: '/jogos/gerenciar',
            permissions: [PERMISSIONS.MANAGE_JOGOS]
          }
        ]
      },
      {
        label: 'Palpites',
        icon: 'pi pi-star',
        items: [
          {
            label: 'Fazer Palpites',
            icon: 'pi pi-plus',
            routerLink: '/palpites/criar',
            permissions: [PERMISSIONS.CREATE_PALPITES]
          },
          {
            label: 'Meus Palpites',
            icon: 'pi pi-list',
            routerLink: '/palpites/meus',
            permissions: [PERMISSIONS.VIEW_PALPITES]
          }
        ]
      },
      {
        label: 'Rankings',
        icon: 'pi pi-trophy',
        items: [
          {
            label: 'Ranking Geral',
            icon: 'pi pi-users',
            routerLink: '/ranking/geral',
            permissions: [PERMISSIONS.VIEW_RANKINGS]
          },
          {
            label: 'Ranking por Bairro',
            icon: 'pi pi-map-marker',
            routerLink: '/ranking/bairros',
            permissions: [PERMISSIONS.VIEW_RANKINGS]
          }
        ]
      },
      {
        label: 'Loja',
        icon: 'pi pi-shopping-cart',
        routerLink: '/loja',
        permissions: [PERMISSIONS.VIEW_LOJA]
      },
      {
        separator: true
      },
      {
        label: 'Administração',
        icon: 'pi pi-cog',
        items: [
          {
            label: 'Dashboard Admin',
            icon: 'pi pi-chart-bar',
            routerLink: '/admin/dashboard',
            permissions: [PERMISSIONS.ADMIN_DASHBOARD]
          },
          {
            label: 'Usuários',
            icon: 'pi pi-users',
            routerLink: '/admin/usuarios',
            permissions: [PERMISSIONS.MANAGE_USERS]
          },
          {
            label: 'Bairros',
            icon: 'pi pi-map',
            routerLink: '/admin/bairros',
            permissions: [PERMISSIONS.MANAGE_BAIRROS]
          },
          {
            label: 'Rodadas',
            icon: 'pi pi-calendar-plus',
            routerLink: '/admin/rodadas',
            permissions: [PERMISSIONS.MANAGE_RODADAS]
          },
          {
            label: 'Configurações',
            icon: 'pi pi-sliders-h',
            routerLink: '/admin/configuracoes',
            permissions: [PERMISSIONS.SYSTEM_SETTINGS]
          }
        ],
        permissions: [PERMISSIONS.ADMIN_DASHBOARD]
      }
    ];
  }

  static filterMenuByPermissions(menuItems: MenuItem[], userRole: UserRole): MenuItem[] {
    return menuItems
      .map(item => ({ ...item })) // Clone para não modificar o original
      .filter(item => {
        // Separadores sempre visíveis
        if (item.separator) {
          return true;
        }

        // Verifica permissões do item
        if (item.permissions && item.permissions.length > 0) {
          const hasPermission = item.permissions.some(permission =>
            this.hasPermission(userRole, permission)
          );
          if (!hasPermission) {
            return false;
          }
        }

        // Verifica roles específicas
        if (item.roles && item.roles.length > 0) {
          if (!item.roles.includes(userRole) && userRole !== UserRole.ADMIN) {
            return false;
          }
        }

        // Filtra subitens recursivamente
        if (item.items && item.items.length > 0) {
          item.items = this.filterMenuByPermissions(item.items, userRole);

          // Remove item pai se não tem subitens visíveis
          if (item.items.length === 0) {
            return false;
          }
        }

        return true;
      });
  }

  private static hasPermission(userRole: UserRole, permission: Permission): boolean {
    // Aqui você pode importar e usar o RoleService
    // Para simplicidade, assumindo que ADMIN tem todas as permissões
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Implementar lógica específica de permissões aqui
    // Pode usar o RoleService.hasPermission
    return false;
  }

  static getUserMenuItems(userRole: UserRole): MenuItem[] {
    const allMenuItems = this.getMenuItems();
    return this.filterMenuByPermissions(allMenuItems, userRole);
  }
}
