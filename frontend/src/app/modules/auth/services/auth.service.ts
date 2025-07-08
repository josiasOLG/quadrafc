import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { PremiumPermissionsService } from '../../../core/services/premium-permissions.service';
import { CreateUserDto, LoginDto, RegisterUserDto, User } from '../../../shared/schemas';
import { HttpService } from '../../../shared/services/http.service';

export interface LoginResponse {
  user: User;
  access_token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private premiumPermissionsService: PremiumPermissionsService
  ) {
    // Inicialização com JWT tokens
    this.initializeAuth();
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this.currentUser?.nivel === 999 || false;
  }

  get needsOnboarding(): boolean {
    const user = this.currentUser;
    if (!user) return false;
    return !user.bairro || !user.data_nascimento || !user.telefone;
  }

  initializeAuth(): Promise<void> {
    return new Promise((resolve) => {
      const token = this.getToken();

      if (!token) {
        // Sem token, usuário não está logado
        this.currentUserSubject.next(null);
        this.loadingSubject.next(false);
        resolve();
        return;
      }

      // Verificar se o token é válido fazendo uma requisição para obter o perfil
      this.httpService.get<User>('auth/profile').subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
          this.premiumPermissionsService.loadPermissions().subscribe();
          this.loadingSubject.next(false);
          // Iniciar refresh automático se usuário estiver logado
          this.startTokenRefreshService();
          resolve();
        },
        error: () => {
          // Token inválido, limpar e deslogar
          this.clearToken();
          this.currentUserSubject.next(null);
          this.loadingSubject.next(false);
          resolve();
        },
      });
    });
  }

  login(credentials: LoginDto): Observable<LoginResponse> {
    return this.httpService.post<LoginResponse>('auth/login', credentials).pipe(
      tap((response) => {
        this.currentUserSubject.next(response.user);
        this.loadingSubject.next(false);
        this.premiumPermissionsService.loadPermissions().subscribe();
        this.setToken(response.access_token); // Armazena o token no localStorage
        // Iniciar refresh automático após login bem-sucedido
        this.startTokenRefreshService();
      })
    );
  }

  register(userData: RegisterUserDto | CreateUserDto): Observable<LoginResponse> {
    return this.httpService.post<LoginResponse>('auth/register', userData).pipe(
      tap((response) => {
        this.currentUserSubject.next(response.user);
        this.loadingSubject.next(false);
        this.premiumPermissionsService.loadPermissions().subscribe();
        this.setToken(response.access_token); // Armazena o token no localStorage
      })
    );
  }

  logout(): Observable<void> {
    return this.httpService.post<void>('auth/logout').pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.premiumPermissionsService.clearPermissions();
        this.clearToken(); // Remove o token do localStorage
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
        this.currentUserSubject.next(user);
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.httpService.put<User>('auth/profile', userData).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
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
        this.currentUserSubject.next(null);
        this.clearToken(); // Limpar token ao deletar conta
        this.clearToken(); // Remove o token do localStorage
      })
    );
  }

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    return this.httpService.get<{ exists: boolean }>('auth/check-email', { email });
  }

  // Método simplificado para validar sessão
  validateSession(): Observable<boolean> {
    return this.httpService.get<any>('auth/validate-session').pipe(
      tap((response) => {
        if (response.valid && response.user) {
          this.currentUserSubject.next(response.user);
        }
      }),
      map((response) => response.valid),
      catchError((error) => {
        console.warn('Erro ao validar sessão:', error);

        if (error.status === 401) {
          this.currentUserSubject.next(null);
          this.clearToken(); // Limpar token em caso de 401
          this.clearToken(); // Remove o token do localStorage em caso de 401
          return of(false);
        }

        return of(!!this.currentUser);
      })
    );
  }

  // Método para renovar token manualmente
  refreshToken(): Observable<void> {
    return this.httpService.post<{ access_token: string }>('auth/refresh', {}).pipe(
      tap((response) => {
        this.setToken(response.access_token);
      }),
      map(() => void 0),
      catchError(() => {
        this.clearToken();
        this.currentUserSubject.next(null);
        return throwError(() => new Error('Falha na renovação do token'));
      })
    );
  }

  // Métodos para gerenciar JWT tokens no localStorage
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

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  // Método para limpar sessão local sem fazer chamada para o backend
  clearLocalSession(): void {
    this.currentUserSubject.next(null);
    this.premiumPermissionsService.clearPermissions();
    this.clearToken();
  }

  private startTokenRefreshService(): void {
    // Iniciar refresh automático do token
    this.scheduleTokenRefresh();
  }

  private scheduleTokenRefresh(): void {
    // Agendar renovação a cada 24 horas
    setInterval(() => {
      if (this.isLoggedIn) {
        this.refreshToken().subscribe({
          next: () => console.log('Token renovado automaticamente'),
          error: (error) => console.error('Falha na renovação automática:', error),
        });
      }
    }, 12 * 60 * 60 * 1000); // 12 horas
  }
}
