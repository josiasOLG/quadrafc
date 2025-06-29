import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { HttpService } from '../../shared/services/http.service';
import { User, LoginDto, CreateUserDto } from '../../shared/schemas';
import { UserRole } from '../guards/roles.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private httpService: HttpService) {
    this.checkAuthStatus();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  get userRole(): UserRole {
    const user = this.currentUser;
    if (!user) return UserRole.USER;

    // Assumindo que o backend vai retornar isAdmin
    return (user as any).isAdmin ? UserRole.ADMIN : UserRole.USER;
  }

  login(credentials: LoginDto): Observable<User> {
    this.isLoadingSubject.next(true);

    return this.httpService.post<User>('auth/login', credentials).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        throw error;
      })
    );
  }

  register(userData: CreateUserDto): Observable<User> {
    this.isLoadingSubject.next(true);

    return this.httpService.post<User>('auth/register', userData).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        throw error;
      })
    );
  }

  logout(): Observable<void> {
    this.isLoadingSubject.next(true);

    return this.httpService.post<void>('auth/logout').pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        // Mesmo em caso de erro, limpa o usuário localmente
        this.currentUserSubject.next(null);
        this.isLoadingSubject.next(false);
        throw error;
      })
    );
  }

  checkAuthStatus(): Observable<User | null> {
    return this.httpService.get<User>('auth/me').pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.httpService.put<User>('auth/profile', userData).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.httpService.post<void>('auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  forgotPassword(email: string): Observable<void> {
    return this.httpService.post<void>('auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.httpService.post<void>('auth/reset-password', {
      token,
      newPassword
    });
  }

  hasRole(role: UserRole): boolean {
    return this.userRole === role || (role === UserRole.USER && this.isAuthenticated);
  }

  isAdmin(): boolean {
    return this.userRole === UserRole.ADMIN;
  }
}
