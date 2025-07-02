import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginData, RegisterData, UserProfile } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

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

  get isLoading$(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  get isAdmin(): boolean {
    // Verificar se o usuário é admin
    const user = this.currentUser;
    console.log('AuthService: Verificando isAdmin para:', user);

    // Para desenvolvimento, permitir acesso se email contém 'admin' ou 'josias'
    if (user?.email && (user.email.includes('admin') || user.email.includes('josias'))) {
      console.log('AuthService: Usuário reconhecido como admin por email');
      return true;
    }

    const isAdmin = user?.isAdmin || (user as any)?.nivel === 999 || false;
    console.log('AuthService: isAdmin resultado:', isAdmin);
    return isAdmin;
  }
  login(credentials: LoginData): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials, {
        withCredentials: true, // Importante para cookies httpOnly
      })
      .pipe(
        tap((response) => {
          console.log('AuthService: Resposta completa do login:', response);

          // A resposta real do backend tem o usuário em "data.user"
          const user = response.data.user;
          console.log('AuthService: Dados do usuário extraídos:', user);

          // Salvar dados no localStorage e cookies
          this.saveUserToStorage(user);
          this.saveUserToCookies(user);

          // Atualizar o estado
          this.currentUserSubject.next(user);
          console.log('AuthService: currentUser atualizado:', this.currentUser);
          console.log('AuthService: isAuthenticated agora é:', this.isAuthenticated);

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

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, userData, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          // A resposta real do backend tem o usuário em "data.user"
          const user = response.data.user;
          this.saveUserToStorage(user);
          this.saveUserToCookies(user);
          this.currentUserSubject.next(user);
          this.isLoadingSubject.next(false);
        }),
        catchError((error) => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  logout(): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/logout`,
        {},
        {
          withCredentials: true,
        }
      )
      .pipe(
        tap(() => {
          this.clearUserDataAndRedirect();
        }),
        catchError(() => {
          // Mesmo em caso de erro, limpar sessão local
          this.clearUserDataAndRedirect();
          return of(null);
        })
      );
  }

  private clearUserDataAndRedirect(): void {
    this.clearUserData();
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`, {
      withCredentials: true,
    });
  }

  updateProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http
      .put<UserProfile>(`${this.apiUrl}/profile`, profileData, {
        withCredentials: true,
      })
      .pipe(
        tap((updatedUser) => {
          this.currentUserSubject.next(updatedUser);
        })
      );
  } // Métodos para gerenciar localStorage e cookies
  private saveUserToStorage(user: UserProfile): void {
    try {
      // Salvar dados do usuário
      const userJson = JSON.stringify(user);
      localStorage.setItem(this.USER_STORAGE_KEY, userJson);
      localStorage.setItem(this.AUTH_STORAGE_KEY, 'true');

      console.log('AuthService: Dados salvos no localStorage');
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }

  private saveUserToCookies(user: UserProfile): void {
    try {
      // Salvar dados do usuário em cookies por 7 dias
      const userJson = JSON.stringify(user);
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);

      // Remover 'secure' para desenvolvimento local
      document.cookie = `${this.USER_STORAGE_KEY}=${encodeURIComponent(
        userJson
      )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      document.cookie = `${
        this.AUTH_STORAGE_KEY
      }=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

      console.log('AuthService: Dados salvos nos cookies');
    } catch (error) {
      console.error('Erro ao salvar dados nos cookies:', error);
    }
  }

  private loadUserFromStorage(): void {
    try {
      console.log('AuthService: Tentando carregar dados do localStorage...');

      // Tentar carregar do localStorage primeiro
      let isAuthenticated = localStorage.getItem(this.AUTH_STORAGE_KEY) === 'true';
      let userJson = localStorage.getItem(this.USER_STORAGE_KEY);

      console.log('AuthService: localStorage auth:', isAuthenticated);
      console.log('AuthService: localStorage user:', userJson ? 'dados encontrados' : 'vazio');

      // Se não encontrar no localStorage, tentar nos cookies
      if (!isAuthenticated || !userJson) {
        console.log('AuthService: Tentando carregar dos cookies...');
        isAuthenticated = this.getCookie(this.AUTH_STORAGE_KEY) === 'true';
        userJson = this.getCookie(this.USER_STORAGE_KEY);

        console.log('AuthService: cookies auth:', isAuthenticated);
        console.log('AuthService: cookies user:', userJson ? 'dados encontrados' : 'vazio');
      }

      if (isAuthenticated && userJson) {
        const user = JSON.parse(userJson) as UserProfile;
        this.currentUserSubject.next(user);
        console.log('AuthService: Usuário carregado com sucesso:', user);

        // Sincronizar localStorage com cookies se necessário
        if (!localStorage.getItem(this.USER_STORAGE_KEY)) {
          console.log('AuthService: Sincronizando localStorage com cookies...');
          this.saveUserToStorage(user);
        }
      } else {
        console.log('AuthService: Nenhum usuário autenticado encontrado');
      }
    } catch (error) {
      console.error('AuthService: Erro ao carregar dados:', error);
      this.clearUserData();
    }
  }

  private getCookie(name: string): string {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookie = parts.pop()?.split(';').shift();
        return cookie ? decodeURIComponent(cookie) : '';
      }
      return '';
    } catch (error) {
      console.error('AuthService: Erro ao ler cookie:', name, error);
      return '';
    }
  }

  // Método público para inicialização da aplicação
  initializeAuth(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('AuthService: Inicializando autenticação...');
      console.log('AuthService: Estado atual - isAuthenticated:', this.isAuthenticated);

      // Se não há usuário carregado ainda, tentar carregar
      if (!this.isAuthenticated) {
        console.log('AuthService: Tentando carregar usuário do storage...');
        this.loadUserFromStorage();
      }

      // Por enquanto, não validar com servidor na inicialização para evitar problemas
      // A validação será feita quando necessário
      console.log('AuthService: Inicialização concluída. Autenticado:', this.isAuthenticated);
      resolve(true);
    });
  }
  private clearUserData(): void {
    // Limpar localStorage
    localStorage.removeItem(this.USER_STORAGE_KEY);
    localStorage.removeItem(this.AUTH_STORAGE_KEY);

    // Limpar cookies
    document.cookie = `${this.USER_STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${this.AUTH_STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    // Limpar estado
    this.currentUserSubject.next(null);
  }

  private loadCurrentUser(): void {
    this.isLoadingSubject.next(true);

    this.getProfile().subscribe({
      next: (user) => {
        this.saveUserToStorage(user);
        this.currentUserSubject.next(user);
        this.isLoadingSubject.next(false);
      },
      error: () => {
        this.clearUserData();
        this.isLoadingSubject.next(false);
      },
    });
  }

  // Verificar se o usuário atual ainda é válido
  validateCurrentUser(): Observable<UserProfile | null> {
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

  // Método público para recarregar dados de autenticação
  reloadAuthData(): void {
    console.log('AuthService: Recarregando dados de autenticação...');
    this.loadUserFromStorage();
  }

  // Verificar se há dados salvos
  hasStoredAuthData(): boolean {
    const hasLocalStorage =
      localStorage.getItem(this.AUTH_STORAGE_KEY) === 'true' &&
      !!localStorage.getItem(this.USER_STORAGE_KEY);
    const hasCookies =
      this.getCookie(this.AUTH_STORAGE_KEY) === 'true' && !!this.getCookie(this.USER_STORAGE_KEY);

    return hasLocalStorage || hasCookies;
  }
}
