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

  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private cookieService: CookieService,
    private premiumPermissionsService: PremiumPermissionsService
  ) {
    // Inicialização mais simples - o backend controla as sessões agora
    this.initializeAuth();
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
    return this.currentUser?.nivel === 999 || false;
  }

  get needsOnboarding(): boolean {
    const user = this.currentUser;
    if (!user) return false;
    return !user.bairro || !user.data_nascimento || !user.telefone;
  }

  initializeAuth(): Promise<void> {
    return new Promise((resolve) => {
      // Verificar sessão no backend
      this.httpService.get<any>('auth/validate-session').subscribe({
        next: (response) => {
          if (response.valid && response.user) {
            this.currentUserSubject.next(response.user);
            this.premiumPermissionsService.loadPermissions().subscribe();
          }
          this.loadingSubject.next(false);
          resolve();
        },
        error: () => {
          // Sessão inválida ou não existe
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
      })
    );
  }

  register(userData: RegisterUserDto | CreateUserDto): Observable<LoginResponse> {
    return this.httpService.post<LoginResponse>('auth/register', userData).pipe(
      tap((response) => {
        this.currentUserSubject.next(response.user);
        this.loadingSubject.next(false);
        this.premiumPermissionsService.loadPermissions().subscribe();
      })
    );
  }

  logout(): Observable<void> {
    return this.httpService.post<void>('auth/logout').pipe(
      tap(() => {
        this.currentUserSubject.next(null);
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
          return of(false);
        }

        return of(!!this.currentUser);
      })
    );
  }
}
