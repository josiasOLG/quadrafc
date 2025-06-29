import { Injectable, inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { HttpService } from '../../shared/services/http.service';

export interface PremiumPermissions {
  filtros: {
    label: string;
    value: string;
    disponivel: boolean;
    gratuito: boolean;
    custo?: number;
  }[];
  acessos: {
    assinaturaPremium: boolean;
    dataVencimentoPremium?: Date;
    estadosAcessiveis: string[];
    cidadesAcessiveis: { cidade: string; estado: string }[];
    temAcessoNacional: boolean;
  };
  custos: {
    cidade: number;
    estado: number;
    nacional: number;
    assinaturaPremiumMensal: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PremiumPermissionsService {
  private permissionsSubject = new BehaviorSubject<PremiumPermissions | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly PERMISSIONS_COOKIE_KEY = 'quadrafc_permissions';
  private readonly COOKIE_EXPIRY_HOURS = 2; // Cache por 2 horas

  public permissions$ = this.permissionsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  private httpService = inject(HttpService);
  private cookieService = inject(CookieService);

  constructor() {
    this.loadFromCache();
  }

  get currentPermissions(): PremiumPermissions | null {
    return this.permissionsSubject.value;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Carrega as permissões do usuário (após login ou quando necessário)
   */
  loadPermissions(): Observable<PremiumPermissions | null> {
    if (this.loadingSubject.value) {
      return this.permissions$; // Já está carregando
    }

    this.loadingSubject.next(true);

    return this.httpService.get<PremiumPermissions>('ranking/filtros-disponiveis').pipe(
      tap((permissions) => {
        if (permissions) {
          this.setPermissions(permissions);
        }
        this.loadingSubject.next(false);
      }),
      catchError(() => {
        this.loadingSubject.next(false);
        return of(null);
      })
    );
  }

  /**
   * Força o recarregamento das permissões (ex: após uma compra)
   */
  refreshPermissions(): Observable<PremiumPermissions | null> {
    this.clearCache();
    return this.loadPermissions();
  }

  /**
   * Verifica se o usuário tem acesso a um filtro específico
   */
  hasAccessTo(filterValue: string): boolean {
    const permissions = this.currentPermissions;
    if (!permissions) return false;

    const filtro = permissions.filtros.find((f) => f.value === filterValue);
    return filtro?.disponivel || false;
  }

  /**
   * Verifica se o usuário tem acesso a uma cidade específica
   */
  hasAccessToCity(cidade: string, estado: string): boolean {
    const permissions = this.currentPermissions;
    if (!permissions) return false;

    // Premium tem acesso a tudo
    if (permissions.acessos.assinaturaPremium) return true;

    // Verificar acesso específico à cidade
    return permissions.acessos.cidadesAcessiveis.some(
      (c) => c.cidade === cidade && c.estado === estado
    );
  }

  /**
   * Verifica se o usuário tem acesso a um estado específico
   */
  hasAccessToState(estado: string): boolean {
    const permissions = this.currentPermissions;
    if (!permissions) return false;

    // Premium tem acesso a tudo
    if (permissions.acessos.assinaturaPremium) return true;

    // Verificar acesso específico ao estado
    return permissions.acessos.estadosAcessiveis.includes(estado);
  }

  /**
   * Verifica se o usuário tem acesso nacional
   */
  hasNationalAccess(): boolean {
    const permissions = this.currentPermissions;
    if (!permissions) return false;

    return permissions.acessos.assinaturaPremium || permissions.acessos.temAcessoNacional;
  }

  /**
   * Verifica se o usuário tem assinatura premium ativa
   */
  hasPremiumSubscription(): boolean {
    const permissions = this.currentPermissions;
    if (!permissions) return false;

    return permissions.acessos.assinaturaPremium;
  }

  /**
   * Obtém o custo para desbloquear um tipo específico de acesso
   */
  getCostFor(type: 'cidade' | 'estado' | 'nacional' | 'assinaturaPremiumMensal'): number {
    const permissions = this.currentPermissions;
    if (!permissions) return 0;

    return permissions.custos[type] || 0;
  }

  /**
   * Obtém todos os filtros disponíveis
   */
  getAvailableFilters(): PremiumPermissions['filtros'] {
    const permissions = this.currentPermissions;
    if (!permissions) return [];

    return permissions.filtros;
  }

  /**
   * Limpa o cache e as permissões
   */
  clearPermissions(): void {
    this.clearCache();
    this.permissionsSubject.next(null);
  }

  private loadFromCache(): void {
    try {
      const cached = this.cookieService.get(this.PERMISSIONS_COOKIE_KEY);
      if (cached) {
        const data = JSON.parse(cached);

        // Verificar se não expirou
        const expiryTime = new Date(data.expiry);
        if (expiryTime > new Date()) {
          this.permissionsSubject.next(data.permissions);
          return;
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar permissões do cache:', error);
    }

    this.clearCache();
  }

  private setPermissions(permissions: PremiumPermissions): void {
    this.permissionsSubject.next(permissions);
    this.saveToCache(permissions);
  }

  private saveToCache(permissions: PremiumPermissions): void {
    try {
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + this.COOKIE_EXPIRY_HOURS);

      const cacheData = {
        permissions,
        expiry: expiryTime.toISOString(),
      };

      this.cookieService.set(this.PERMISSIONS_COOKIE_KEY, JSON.stringify(cacheData), {
        expires: expiryTime,
        path: '/',
        secure: true,
        sameSite: 'Strict',
      });
    } catch (error) {
      console.warn('Erro ao salvar permissões no cache:', error);
    }
  }

  private clearCache(): void {
    this.cookieService.delete(this.PERMISSIONS_COOKIE_KEY, '/');
  }
}
