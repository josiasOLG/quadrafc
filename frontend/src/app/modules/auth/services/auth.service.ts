import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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
    // Verificar imediatamente se tem cookie para evitar loading desnecessário
    const storedUser = this.cookieService.get(this.USER_COOKIE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.loadingSubject.next(false); // Para de carregar imediatamente
      } catch (error) {
        this.cookieService.delete(this.USER_COOKIE_KEY);
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

  private initializeUser(): void {
    // Se já carregou do cookie, só faz verificação em background
    if (this.currentUser) {
      // Verificar se o usuário ainda está válido no backend (em background)
      this.httpService.get<User>('auth/profile').subscribe({
        next: (user) => {
          this.setCurrentUser(user);
          // Carregar permissões se usuário está válido
          this.premiumPermissionsService.loadPermissions().subscribe();
        },
        error: () => this.clearCurrentUser(),
      });
      return;
    }

    // Se não tem cookie, faz carregamento normal
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
      error: () => {
        this.clearCurrentUser();
        this.loadingSubject.next(false);
      },
    });
  }

  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    // Salvar no cookie com expiração de 7 dias
    this.cookieService.set(
      this.USER_COOKIE_KEY,
      JSON.stringify(user),
      7, // 7 dias
      '/', // path
      undefined, // domain
      true, // secure (apenas HTTPS em produção)
      'Strict' // sameSite
    );
  }

  private clearCurrentUser(): void {
    this.currentUserSubject.next(null);
    this.cookieService.delete(this.USER_COOKIE_KEY, '/');
    // Limpar permissões quando usuário é removido
    this.premiumPermissionsService.clearPermissions();
  }
}
