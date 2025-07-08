import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { PremiumPermissionsService } from '../../../core/services/premium-permissions.service';
import { CreateUserDto, LoginDto, RegisterUserDto, User } from '../../../shared/schemas';
import { HttpService } from '../../../shared/services/http.service';

export interface LoginResponse {
  user: User;
  access_token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private readonly USER_COOKIE_KEY = 'quadrafc_user';

  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private cookieService: CookieService,
    private premiumPermissionsService: PremiumPermissionsService
  ) {
    // Verificar imediatamente se tem dados salvos para evitar loading desnecessário
    let storedUser = this.cookieService.get(this.USER_COOKIE_KEY);

    // BACKUP: Se não tem cookie, tentar localStorage (importante para PWA iOS)
    if (!storedUser) {
      try {
        storedUser = localStorage.getItem(this.USER_COOKIE_KEY) || '';
        // Verificar se os dados não são muito antigos (7 dias)
        const timestamp = localStorage.getItem(this.USER_COOKIE_KEY + '_timestamp');
        if (timestamp) {
          const age = Date.now() - parseInt(timestamp);
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
          if (age > maxAge) {
            localStorage.removeItem(this.USER_COOKIE_KEY);
            localStorage.removeItem(this.USER_COOKIE_KEY + '_timestamp');
            storedUser = '';
          }
        }
      } catch {
        storedUser = '';
      }
    }

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.loadingSubject.next(false); // Para de carregar imediatamente
      } catch {
        this.cookieService.delete(this.USER_COOKIE_KEY);
        try {
          localStorage.removeItem(this.USER_COOKIE_KEY);
          localStorage.removeItem(this.USER_COOKIE_KEY + '_timestamp');
        } catch {
          // Ignore localStorage errors
        }
      }
    }

    this.initializeUser();
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this.currentUser?.nivel === 999 || false; // Assumindo que admin tem nível 999
  }

  get needsOnboarding(): boolean {
    const user = this.currentUser;
    if (!user) return false;

    // Usuário precisa de onboarding se não tem os campos obrigatórios do onboarding
    return !user.bairro || !user.data_nascimento || !user.telefone;
  }

  // Detectar se está em modo PWA
  get isPWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  initializeAuth(): Promise<void> {
    return new Promise((resolve) => {
      // Se já tem dados do cookie, resolver imediatamente
      if (this.currentUser) {
        resolve();
        return;
      }

      // Se não tem dados, aguardar o carregamento terminar
      this.loading$.subscribe((loading) => {
        if (!loading) {
          resolve();
        }
      });
    });
  }

  login(credentials: LoginDto): Observable<LoginResponse> {
    return this.httpService.post<LoginResponse>('auth/login', credentials).pipe(
      tap((response) => {
        this.setCurrentUser(response.user);
        this.loadingSubject.next(false);
        // Carregar permissões após login bem-sucedido
        this.premiumPermissionsService.loadPermissions().subscribe();
      })
    );
  }

  register(userData: RegisterUserDto | CreateUserDto): Observable<LoginResponse> {
    return this.httpService.post<LoginResponse>('auth/register', userData).pipe(
      tap((response) => {
        this.setCurrentUser(response.user);
        this.loadingSubject.next(false);
        // Carregar permissões após registro bem-sucedido
        this.premiumPermissionsService.loadPermissions().subscribe();
      })
    );
  }

  logout(): Observable<void> {
    return this.httpService.post<void>('auth/logout').pipe(
      tap(() => {
        this.clearCurrentUser();
        // Limpar permissões ao fazer logout
        this.premiumPermissionsService.clearPermissions();
      })
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.httpService.post<{ message: string }>('auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.httpService.post<{ message: string }>('auth/reset-password', {
      token,
      newPassword,
    });
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.httpService.post<{ message: string }>('auth/verify-email', { token });
  }

  resendVerificationEmail(): Observable<{ message: string }> {
    return this.httpService.post<{ message: string }>('auth/resend-verification');
  }

  refreshProfile(): Observable<User> {
    return this.httpService.get<User>('auth/profile').pipe(
      tap((user) => {
        this.setCurrentUser(user);
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.httpService.put<User>('auth/profile', userData).pipe(
      tap((user) => {
        this.setCurrentUser(user);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.httpService.post<{ message: string }>('auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  deleteAccount(password: string): Observable<{ message: string }> {
    return this.httpService.post<{ message: string }>('auth/delete-account', { password }).pipe(
      tap(() => {
        this.clearCurrentUser();
      })
    );
  }

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    return this.httpService.get<{ exists: boolean }>('auth/check-email', { email });
  }

  // Método para verificar se a sessão ainda está válida (útil para PWA)
  validateSession(): Observable<boolean> {
    if (!this.currentUser) {
      return of(false);
    }

    return this.httpService.get<User>('auth/profile').pipe(
      tap((user) => {
        this.setCurrentUser(user);
        // Atualizar timestamp do localStorage
        try {
          localStorage.setItem(this.USER_COOKIE_KEY + '_timestamp', Date.now().toString());
        } catch {
          // Ignore localStorage errors
        }
      }),
      map(() => true),
      catchError((error) => {
        console.warn('Erro ao validar sessão:', error);

        // Se for erro 401 (não autorizado), limpar sessão
        if (error.status === 401) {
          this.clearCurrentUser();
          return of(false);
        }

        // Para outros erros (rede, servidor), manter sessão local
        // e tentar novamente mais tarde
        console.log('Mantendo sessão local devido a erro temporário');
        return of(true);
      })
    );
  }

  private initializeUser(): void {
    // Se já carregou do localStorage/cookie, só faz verificação em background se necessário
    if (this.currentUser) {
      this.loadingSubject.next(false);

      // Em modo PWA, ser mais conservador com validações
      if (this.isPWA) {
        // Só validar no backend após muito tempo em modo PWA
        const timestamp = localStorage.getItem(this.USER_COOKIE_KEY + '_timestamp');
        if (timestamp) {
          const age = Date.now() - parseInt(timestamp);
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias em PWA

          if (age < maxAge) {
            // Dados válidos para PWA, não validar no backend
            this.premiumPermissionsService.loadPermissions().subscribe();
            return;
          }
        } else {
          // Se não tem timestamp em PWA, criar um e não validar agora
          try {
            localStorage.setItem(this.USER_COOKIE_KEY + '_timestamp', Date.now().toString());
          } catch {
            // Ignore
          }
          this.premiumPermissionsService.loadPermissions().subscribe();
          return;
        }
      } else {
        // No navegador normal, validar após 24h
        const timestamp = localStorage.getItem(this.USER_COOKIE_KEY + '_timestamp');
        if (timestamp) {
          const age = Date.now() - parseInt(timestamp);
          const maxAge = 24 * 60 * 60 * 1000; // 24 horas

          if (age < maxAge) {
            // Dados recentes, não precisa validar no backend agora
            this.premiumPermissionsService.loadPermissions().subscribe();
            return;
          }
        }
      }

      // Dados antigos, validar no backend em background (sem limpar se der erro)
      this.httpService.get<User>('auth/profile').subscribe({
        next: (user) => {
          this.setCurrentUser(user);
          // Carregar permissões se usuário está válido
          this.premiumPermissionsService.loadPermissions().subscribe();
        },
        error: (error) => {
          console.warn('Erro ao validar sessão no backend, mantendo dados locais:', error);
          // NÃO limpar o usuário aqui - pode ser erro de rede temporário
          // Só atualizar o timestamp para tentar novamente mais tarde
          try {
            localStorage.setItem(this.USER_COOKIE_KEY + '_timestamp', Date.now().toString());
          } catch {
            // Ignore
          }
          this.premiumPermissionsService.loadPermissions().subscribe();
        },
      });
      return;
    }

    // Se não tem dados salvos, tentar carregar do backend
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    // Buscar dados do usuário do backend via cookie httpOnly
    this.httpService.get<User>('auth/profile').subscribe({
      next: (user) => {
        this.setCurrentUser(user);
        this.loadingSubject.next(false);
        // Carregar permissões após carregar usuário
        this.premiumPermissionsService.loadPermissions().subscribe();
      },
      error: (error) => {
        console.warn('Erro ao carregar usuário do backend:', error);

        // Se for erro 401, realmente não tem sessão válida
        if (error.status === 401) {
          this.clearCurrentUser();
        }

        // Para outros erros, apenas parar o loading sem limpar dados
        this.loadingSubject.next(false);
      },
    });
  }

  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    const userJson = JSON.stringify(user);

    // Salvar no cookie com configurações otimizadas para PWA iOS
    this.cookieService.set(
      this.USER_COOKIE_KEY,
      userJson,
      7, // 7 dias
      '/', // path
      undefined, // domain
      false, // secure (false para desenvolvimento, será true em produção via backend httpOnly cookie)
      'Lax' // sameSite - Lax é melhor para PWA iOS
    );

    // BACKUP: Salvar também no localStorage para PWA iOS
    try {
      localStorage.setItem(this.USER_COOKIE_KEY, userJson);
      localStorage.setItem(this.USER_COOKIE_KEY + '_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
    }
  }

  private clearCurrentUser(): void {
    this.currentUserSubject.next(null);
    this.cookieService.delete(this.USER_COOKIE_KEY, '/');

    // Limpar também do localStorage
    try {
      localStorage.removeItem(this.USER_COOKIE_KEY);
      localStorage.removeItem(this.USER_COOKIE_KEY + '_timestamp');
    } catch {
      console.warn('Erro ao limpar localStorage');
    }

    // Limpar permissões quando usuário é removido
    this.premiumPermissionsService.clearPermissions();
  }
}
