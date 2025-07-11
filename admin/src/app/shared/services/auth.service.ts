import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginData, RegisterData, UserProfile } from '../models/auth.model';
import { JwtHelper } from '../utils/jwt-helper';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  // Chaves para o localStorage
  private readonly USER_STORAGE_KEY = 'quadrafc_admin_user';
  private readonly AUTH_STORAGE_KEY = 'quadrafc_admin_auth';

  constructor(private http: HttpClient, private router: Router) {
    // Carregar dados salvos imediatamente
    this.loadUserFromStorage();
  }

  get currentUser$(): Observable<UserProfile | null> {
    return this.currentUserSubject.asObservable();
  }

  get currentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  get token$(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get isLoading$(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser && !!this.token;
  }

  get isAdmin(): boolean {
    // Verificar se o usuário é admin
    const user = this.currentUser;

    // Para desenvolvimento, permitir acesso se email contém 'admin' ou 'josias'
    if (user?.email && (user.email.includes('admin') || user.email.includes('josias'))) {
      return true;
    }

    const isAdmin = user?.isAdmin || (user as any)?.nivel === 999 || false;
    return isAdmin;
  }

  hasStoredAuthData(): boolean {
    return (
      !!localStorage.getItem(this.USER_STORAGE_KEY) && !!localStorage.getItem(this.AUTH_STORAGE_KEY)
    );
  }

  reloadAuthData(): void {
    this.loadUserFromStorage();
  }

  login(credentials: LoginData): Observable<AuthResponse | any> {
    this.isLoadingSubject.next(true);

    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        // Verificar se a resposta tem estrutura padrão com 'data' ou direta
        let token: string | undefined;
        let user: UserProfile | undefined;

        if (response.data && response.data.access_token) {
          // Formato padrão: { data: { user, access_token } }
          token = response.data.access_token;
          user = response.data.user;
        } else if (response.access_token) {
          // Formato direto: { user, access_token }
          token = response.access_token;
          user = response.user;
        }

        if (token) {
          // Salvar o token no localStorage
          localStorage.setItem(this.AUTH_STORAGE_KEY, token);
          this.tokenSubject.next(token);
        } else {
        }

        if (user) {
          // Salvar dados no localStorage
          this.saveUserToStorage(user);
          // Atualizar o estado
          this.currentUserSubject.next(user);
        }

        this.isLoadingSubject.next(false);
      }),
      catchError((error) => {
        this.isLoadingSubject.next(false);
        throw error;
      })
    );
  }
  register(userData: RegisterData): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap((response) => {
        // Extrair o token JWT da resposta
        const token = response.data.access_token;
        if (token) {
          localStorage.setItem(this.AUTH_STORAGE_KEY, token);
          this.tokenSubject.next(token);
        }

        // A resposta real do backend tem o usuário em "data.user"
        const user = response.data.user;
        this.saveUserToStorage(user);
        this.currentUserSubject.next(user);
        this.isLoadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('AuthService: Erro no registro:', error);
        this.isLoadingSubject.next(false);
        throw error;
      })
    );
  }

  logout(): Observable<any> {
    // Tentar fazer logout no servidor (opcional)
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {}),
      catchError((error) => {
        return of(null);
      }),
      tap(() => {
        // Limpar dados da sessão
        localStorage.removeItem(this.USER_STORAGE_KEY);
        localStorage.removeItem(this.AUTH_STORAGE_KEY);

        // Atualizar estado
        this.currentUserSubject.next(null);
        this.tokenSubject.next(null);
      }),
      tap(() => {
        // Redirecionar para login
        this.router.navigate(['/login'], { replaceUrl: true });
      })
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`).pipe(
      tap((user) => {
        // Atualizar dados do usuário no localStorage e no estado
        this.saveUserToStorage(user);
        this.currentUserSubject.next(user);
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.logout(); // Logout se token expirado
        }
        throw error;
      })
    );
  }

  updateProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profileData).pipe(
      tap((updatedUser) => {
        this.saveUserToStorage(updatedUser);
        this.currentUserSubject.next(updatedUser);
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  /**
   * Verifica se o token JWT está próximo de expirar e, se estiver,
   * tenta renová-lo automaticamente
   * @param minimumValidTime Tempo mínimo de validade em segundos (padrão: 5 minutos)
   */
  checkAndRenewTokenIfNeeded(minimumValidTime: number = 300): void {
    const token = this.token;
    if (!token) return;

    const remainingTime = JwtHelper.getTokenRemainingTime(token);

    // Se tiver menos de X segundos (5 minutos por padrão), tentar renovar
    if (remainingTime > 0 && remainingTime < minimumValidTime) {
      this.refreshToken().subscribe({
        next: () => {},
        error: (err) => {},
      });
    }
  }

  /**
   * Tenta renovar o token JWT atual
   * @returns Observable com o resultado da renovação
   */
  refreshToken(): Observable<any> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, {}).pipe(
      tap((response) => {
        if (response.data.access_token) {
          localStorage.setItem(this.AUTH_STORAGE_KEY, response.data.access_token);
          this.tokenSubject.next(response.data.access_token);
        }
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.logout();
        }
        throw error;
      })
    );
  }

  // Métodos para gerenciar localStorage
  private loadUserFromStorage(): void {
    try {
      // Carregar usuário do localStorage
      const storedUserJson = localStorage.getItem(this.USER_STORAGE_KEY);
      if (storedUserJson) {
        const storedUser = JSON.parse(storedUserJson);
        this.currentUserSubject.next(storedUser);
      }

      const storedToken = localStorage.getItem(this.AUTH_STORAGE_KEY);
      if (storedToken) {
        this.tokenSubject.next(storedToken);
      }
    } catch (error) {
      console.error('AuthService: Erro ao carregar dados do localStorage:', error);
      this.clearUserData(); // Limpar dados em caso de erro
    }
  }

  private saveUserToStorage(user: UserProfile): void {
    if (user) {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
    }
  }

  private clearUserData(): void {
    // Limpar localStorage
    localStorage.removeItem(this.USER_STORAGE_KEY);
    localStorage.removeItem(this.AUTH_STORAGE_KEY);

    // Limpar estado
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }

  // Verificar token JWT
  checkTokenValidity(): boolean {
    const token = this.token;
    if (!token) return false;

    return !JwtHelper.isTokenExpired(token);
  }

  // Verificar se o usuário atual ainda é válido
  validateCurrentUser(): Observable<UserProfile | null> {
    // Se não tiver token, nem tenta validar
    if (!this.token) {
      return of(null);
    }

    return this.getProfile().pipe(
      tap((user) => {
        this.saveUserToStorage(user);
        this.currentUserSubject.next(user);
      }),
      catchError(() => {
        this.clearUserData();
        return of(null);
      })
    );
  }
}
