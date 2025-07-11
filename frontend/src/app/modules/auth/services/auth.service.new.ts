import { computed, effect, Injectable, signal } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  firstValueFrom,
  map,
  Observable,
  of,
  tap,
  throwError,
} from 'rxjs';
import { PremiumPermissionsService } from '../../../core/services/premium-permissions.service';
import { CreateUserDto, LoginDto, RegisterUserDto, User } from '../../../shared/schemas';
import { HttpService } from '../../../shared/services/http.service';

export interface LoginResponse {
  user: User;
  access_token: string;
}

export type AuthState =
  | 'INITIAL'
  | 'LOADING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED'
  | 'NEEDS_ONBOARDING';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals para estado reativo moderno
  private _authState = signal<AuthState>('INITIAL');
  private _currentUser = signal<User | null>(null);
  private _isInitialized = signal<boolean>(false);

  // Computed signals para estados derivados
  public readonly authState = this._authState.asReadonly();
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isInitialized = this._isInitialized.asReadonly();
  public readonly isLoading = computed(
    () => this._authState() === 'LOADING' || this._authState() === 'INITIAL'
  );
  public readonly isAuthenticated = computed(
    () => this._authState() === 'AUTHENTICATED' || this._authState() === 'NEEDS_ONBOARDING'
  );
  public readonly needsOnboarding = computed(() => {
    const user = this._currentUser();
    if (!user || this._authState() !== 'AUTHENTICATED') return false;
    return !user.bairro || !user.data_nascimento || !user.telefone;
  });

  // Observables para compatibilidade com código existente
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private premiumPermissionsService: PremiumPermissionsService
  ) {
    // Effect para sincronizar signals com BehaviorSubjects
    effect(() => {
      this.currentUserSubject.next(this._currentUser());
      this.loadingSubject.next(this.isLoading());
    });

    // Inicialização síncrona do estado baseado no localStorage
    this.initializeSyncState();
  }

  /**
   * Inicialização síncrona IMEDIATA do estado baseado no localStorage
   * Previne completamente o flash da tela de login
   */
  private initializeSyncState(): void {
    if (typeof window === 'undefined') {
      this._authState.set('UNAUTHENTICATED');
      this._isInitialized.set(true);
      return;
    }

    const token = this.getToken();
    const cachedUser = this.getCachedUser();

    if (!token) {
      console.log('🔄 AuthService: Sem token - estado não autenticado');
      this._authState.set('UNAUTHENTICATED');
      this._currentUser.set(null);
      this._isInitialized.set(true);
      return;
    }

    if (cachedUser) {
      console.log('🔄 AuthService: Token e usuário encontrados - estado autenticado imediatamente');
      this._currentUser.set(cachedUser);

      // Determinar estado baseado na necessidade de onboarding
      const needsOnboarding =
        !cachedUser.bairro || !cachedUser.data_nascimento || !cachedUser.telefone;
      this._authState.set(needsOnboarding ? 'NEEDS_ONBOARDING' : 'AUTHENTICATED');
      this._isInitialized.set(true);
      return;
    }

    // Token existe mas sem cache - manter como loading para validação
    console.log('🔄 AuthService: Token encontrado mas sem cache - aguardando validação');
    this._authState.set('LOADING');
  }

  /**
   * Validação assíncrona do token (chamada pelo APP_INITIALIZER)
   */
  async initializeAuth(): Promise<void> {
    // Se já foi inicializado sincronamente e está autenticado, não precisa validar
    if (this._isInitialized() && this.isAuthenticated()) {
      console.log('✅ AuthService: Já inicializado e autenticado - pulando validação');
      return;
    }

    const token = this.getToken();
    if (!token) {
      this._authState.set('UNAUTHENTICATED');
      this._isInitialized.set(true);
      return;
    }

    try {
      this._authState.set('LOADING');

      console.log('🔄 AuthService: Validando token com o backend...');
      const user = await firstValueFrom(
        this.httpService.get<User>('auth/profile').pipe(
          catchError(() => {
            // Token inválido
            this.clearAllData();
            return of(null);
          })
        )
      );

      if (user) {
        console.log('✅ AuthService: Token válido - usuário autenticado', user.email);
        this._currentUser.set(user);
        this.setCachedUser(user);

        const needsOnboarding = !user.bairro || !user.data_nascimento || !user.telefone;
        this._authState.set(needsOnboarding ? 'NEEDS_ONBOARDING' : 'AUTHENTICATED');

        // Carregar permissões premium
        this.premiumPermissionsService.loadPermissions().subscribe();
        this.startTokenRefreshService();
      } else {
        this._authState.set('UNAUTHENTICATED');
        this._currentUser.set(null);
      }
    } catch (error) {
      console.error('❌ AuthService: Erro na validação do token', error);
      this.clearAllData();
      this._authState.set('UNAUTHENTICATED');
      this._currentUser.set(null);
    } finally {
      this._isInitialized.set(true);
    }
  }

  login(credentials: LoginDto): Observable<LoginResponse> {
    return this.httpService.post<LoginResponse>('auth/login', credentials).pipe(
      tap((response) => {
        this._currentUser.set(response.user);
        this.setCachedUser(response.user);
        this.setToken(response.access_token);

        const needsOnboarding =
          !response.user.bairro || !response.user.data_nascimento || !response.user.telefone;
        this._authState.set(needsOnboarding ? 'NEEDS_ONBOARDING' : 'AUTHENTICATED');

        this.premiumPermissionsService.loadPermissions().subscribe();
        this.startTokenRefreshService();
      })
    );
  }

  register(userData: RegisterUserDto | CreateUserDto): Observable<LoginResponse> {
    return this.httpService.post<LoginResponse>('auth/register', userData).pipe(
      tap((response) => {
        this._currentUser.set(response.user);
        this.setCachedUser(response.user);
        this.setToken(response.access_token);

        const needsOnboarding =
          !response.user.bairro || !response.user.data_nascimento || !response.user.telefone;
        this._authState.set(needsOnboarding ? 'NEEDS_ONBOARDING' : 'AUTHENTICATED');

        this.premiumPermissionsService.loadPermissions().subscribe();
      })
    );
  }

  logout(): Observable<void> {
    return this.httpService.post<void>('auth/logout').pipe(
      tap(() => {
        this.clearAllData();
        this._authState.set('UNAUTHENTICATED');
        this._currentUser.set(null);
      }),
      catchError(() => {
        // Mesmo se o logout falhar no backend, limpar localmente
        this.clearAllData();
        this._authState.set('UNAUTHENTICATED');
        this._currentUser.set(null);
        return of(undefined);
      })
    );
  }

  /**
   * Atualiza o usuário após completar onboarding
   */
  updateUserAfterOnboarding(user: User): void {
    this._currentUser.set(user);
    this.setCachedUser(user);
    this._authState.set('AUTHENTICATED');
  }

  // Métodos privados para gerenciar localStorage
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  private getCachedUser(): User | null {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('current_user');
      if (cached) {
        try {
          return JSON.parse(cached) as User;
        } catch {
          localStorage.removeItem('current_user');
        }
      }
    }
    return null;
  }

  private setCachedUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_user', JSON.stringify(user));
    }
  }

  private clearAllData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
    }
    this.premiumPermissionsService.clearPermissions();
  }

  // Getters para compatibilidade
  get isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  get currentUserValue(): User | null {
    return this._currentUser();
  }

  get isAdmin(): boolean {
    const user = this._currentUser();
    return user?.nivel === 999 || false;
  }

  // Métodos de renovação de token
  refreshToken(): Observable<void> {
    return this.httpService.post<{ access_token: string }>('auth/refresh', {}).pipe(
      tap((response) => {
        this.setToken(response.access_token);
      }),
      map(() => void 0),
      catchError(() => {
        this.clearAllData();
        this._authState.set('UNAUTHENTICATED');
        this._currentUser.set(null);
        return throwError(() => new Error('Falha na renovação do token'));
      })
    );
  }

  private startTokenRefreshService(): void {
    this.scheduleTokenRefresh();
  }

  private scheduleTokenRefresh(): void {
    setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshToken().subscribe({
          next: () => console.log('Token renovado automaticamente'),
          error: (error) => console.error('Falha na renovação automática:', error),
        });
      }
    }, 12 * 60 * 60 * 1000); // 12 horas
  }
}
