import { computed, effect, Injectable, signal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';
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

  // Promise que resolve quando o AuthService estiver 100% pronto
  private _readyPromise: Promise<void>;
  private _readyResolve!: () => void;

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
    private premiumPermissionsService: PremiumPermissionsService,
    private cookieService: CookieService
  ) {
    // Inicializar a Promise de prontidão
    this._readyPromise = new Promise<void>((resolve) => {
      this._readyResolve = resolve;
    });

    // INICIALIZAÇÃO ABSOLUTAMENTE SÍNCRONA - ANTES DE QUALQUER COISA
    this.initializeSyncStateImmediate();

    // Effect para sincronizar signals com BehaviorSubjects
    effect(() => {
      this.currentUserSubject.next(this._currentUser());
      this.loadingSubject.next(this.isLoading());
    });
  }

  /**
   * Inicialização IMEDIATA e SÍNCRONA - executada no constructor
   * Usa localStorage como principal, cookies como backup
   */
  private initializeSyncStateImmediate(): void {
    // FORÇAR estado LOADING primeiro para evitar flash de UNAUTHENTICATED
    this._authState.set('LOADING');

    // Usar localStorage como principal, cookies como backup
    let isLoggedIn = false;
    let userDataString = '';

    if (typeof window !== 'undefined') {
      // Tentar localStorage primeiro (mais rápido e confiável)
      const localLoggedIn = localStorage.getItem('quadrafc_logged_in');
      const localUserData = localStorage.getItem('quadrafc_user_data');

      if (localLoggedIn === 'true' && localUserData) {
        isLoggedIn = true;
        userDataString = localUserData;
      } else {
        // Fallback para cookies se localStorage não tiver dados
        const cookieLoggedIn = this.cookieService.get('quadrafc_logged_in');
        const cookieUserData = this.cookieService.get('quadrafc_user_data');

        if (cookieLoggedIn === 'true' && cookieUserData) {
          isLoggedIn = true;
          userDataString = cookieUserData;

          // Sincronizar de volta para localStorage se veio dos cookies
          localStorage.setItem('quadrafc_logged_in', 'true');
          localStorage.setItem('quadrafc_user_data', cookieUserData);
        }
      }
    } else {
      // SSR: usar apenas cookies
      const cookieLoggedIn = this.cookieService.get('quadrafc_logged_in');
      const cookieUserData = this.cookieService.get('quadrafc_user_data');

      if (cookieLoggedIn === 'true' && cookieUserData) {
        isLoggedIn = true;
        userDataString = cookieUserData;
      }
    }

    // Se não está logado, definir como UNAUTHENTICATED imediatamente
    if (!isLoggedIn || !userDataString) {
      this._authState.set('UNAUTHENTICATED');
      this._currentUser.set(null);
      this._isInitialized.set(true);
      this._readyResolve();
      return;
    }

    // Tentar fazer parse dos dados do usuário
    try {
      const cachedUser = JSON.parse(decodeURIComponent(userDataString)) as User;
      this._currentUser.set(cachedUser);

      // Determinar se precisa de onboarding
      const needsOnboarding =
        !cachedUser.bairro || !cachedUser.data_nascimento || !cachedUser.telefone;

      // Definir estado final baseado nos dados do usuário
      const finalState = needsOnboarding ? 'NEEDS_ONBOARDING' : 'AUTHENTICATED';
      this._authState.set(finalState);

      // Inicializar serviços em background se autenticado
      if (!needsOnboarding) {
        setTimeout(() => {
          this.premiumPermissionsService.loadPermissions().subscribe();
          this.startTokenRefreshService();
        }, 0);
      }
    } catch {
      // Se houve erro no parse, limpar tudo e marcar como não autenticado
      this.clearAllData();
      this._authState.set('UNAUTHENTICATED');
      this._currentUser.set(null);
    }

    // Marcar como inicializado sempre no final
    this._isInitialized.set(true);

    // Resolver a Promise de prontidão IMEDIATAMENTE no SSR, com delay mínimo no browser
    if (typeof window !== 'undefined') {
      // Browser: pequeno delay para garantir estabilidade
      setTimeout(() => {
        this._readyResolve();
      }, 10);
    } else {
      // SSR: resolver imediatamente para evitar bloqueios
      this._readyResolve();
    }
  }
  /**
   * Retorna uma Promise que resolve quando o AuthService estiver completamente pronto
   */
  public waitUntilReady(): Promise<void> {
    return this._readyPromise;
  }

  /**
   * Inicialização do AuthService - chamada pelo APP_INITIALIZER
   */
  async initializeAuth(): Promise<void> {
    // Aguardar até que a inicialização síncrona seja concluída
    await this.waitUntilReady();
    return Promise.resolve();
  }

  login(credentials: LoginDto): Observable<LoginResponse> {
    return this.httpService.post<LoginResponse>('auth/login', credentials).pipe(
      tap((response) => {
        this._currentUser.set(response.user);
        this.setUserData(response.user, response.access_token);

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
        this.setUserData(response.user, response.access_token);

        const needsOnboarding =
          !response.user.bairro || !response.user.data_nascimento || !response.user.telefone;
        this._authState.set(needsOnboarding ? 'NEEDS_ONBOARDING' : 'AUTHENTICATED');

        this.premiumPermissionsService.loadPermissions().subscribe();
      })
    );
  }

  logout(): void {
    this.clearAllData();
    this._authState.set('UNAUTHENTICATED');
    this._currentUser.set(null);
  }

  /**
   * Atualiza o usuário após completar onboarding
   */
  updateUserAfterOnboarding(user: User): void {
    this._currentUser.set(user);
    this.updateUserInCookie(user);
    this._authState.set('AUTHENTICATED');
  }

  /**
   * Updates user profile data
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    return this.httpService.put<User>('auth/profile', userData).pipe(
      tap((updatedUser) => {
        this._currentUser.set(updatedUser);
        this.updateUserInCookie(updatedUser);

        // Update auth state if onboarding is now complete
        const needsOnboarding =
          !updatedUser.bairro || !updatedUser.data_nascimento || !updatedUser.telefone;
        if (!needsOnboarding && this._authState() === 'NEEDS_ONBOARDING') {
          this._authState.set('AUTHENTICATED');
        }
      })
    );
  }

  /**
   * Validates the current session with the server
   */
  validateSession(): Observable<boolean> {
    return this.httpService.get<User>('auth/profile').pipe(
      map((user) => {
        this._currentUser.set(user);
        this.updateUserInCookie(user);

        const needsOnboarding = !user.bairro || !user.data_nascimento || !user.telefone;
        this._authState.set(needsOnboarding ? 'NEEDS_ONBOARDING' : 'AUTHENTICATED');

        return true;
      }),
      catchError(() => {
        this.clearAllData();
        this._authState.set('UNAUTHENTICATED');
        this._currentUser.set(null);
        return of(false);
      })
    );
  }

  // Métodos para gerenciar dados de autenticação via localStorage e cookies
  private setUserData(user: User, token: string): void {
    const encodedUserData = encodeURIComponent(JSON.stringify(user));

    if (typeof window !== 'undefined') {
      // Salvar no localStorage (principal)
      localStorage.setItem('quadrafc_logged_in', 'true');
      localStorage.setItem('quadrafc_user_data', encodedUserData);
      localStorage.setItem('access_token', token);
    }

    // Salvar nos cookies (backup)
    try {
      this.cookieService.set('quadrafc_logged_in', 'true', {
        expires: 30,
        path: '/',
        secure: false,
        sameSite: 'Lax',
      });

      this.cookieService.set('quadrafc_user_data', encodedUserData, {
        expires: 30,
        path: '/',
        secure: false,
        sameSite: 'Lax',
      });
    } catch {
      // Silently fail if cookies can't be set
    }
  }

  private updateUserInCookie(user: User): void {
    const encodedUserData = encodeURIComponent(JSON.stringify(user));

    // Atualizar localStorage (principal)
    if (typeof window !== 'undefined') {
      localStorage.setItem('quadrafc_user_data', encodedUserData);
    }

    // Atualizar cookies (backup)
    this.cookieService.set('quadrafc_user_data', encodedUserData, 30); // 30 dias
  }

  private clearAllData(): void {
    this.cookieService.deleteAll();
    localStorage.clear();
    this.premiumPermissionsService.clearPermissions();
  }

  /**
   * Método público para re-inicialização se necessário
   */
  public initializeSyncState(): void {
    this.initializeSyncStateImmediate();
  }

  /**
   * Método para compatibilidade - salva usuário em cache
   */
  private setCachedUser(user: User): void {
    this.updateUserInCookie(user);
  }

  /**
   * Método para compatibilidade - salva token
   */
  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
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
        // Atualizar token no localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', response.access_token);
        }
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
          error: () => {
            // Silent fail for automatic refresh
          },
        });
      }
    }, 12 * 60 * 60 * 1000); // 12 horas
  }
}
