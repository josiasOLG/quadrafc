import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserCreate, UserFilters, UserListResponse, UserUpdate } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(filters?: UserFilters): Observable<UserListResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof UserFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<any>(this.apiUrl, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          // O backend retorna { success: true, data: { users: [...], total, page, limit } }
          if (response.data && response.data.users) {
            return {
              users: response.data.users,
              total: response.data.total,
              page: response.data.page,
              limit: response.data.limit,
            } as UserListResponse;
          }
          // Fallback para formato direto
          return response as UserListResponse;
        })
      );
  }

  getById(id: string | number): Observable<User> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          // O backend retorna { success: true, data: {...} }
          if (response.data) {
            return response.data as User;
          }
          // Fallback para formato direto
          return response as User;
        })
      );
  }

  getUserById(id: number): Observable<User> {
    return this.getById(id);
  }

  createUser(user: UserCreate): Observable<User> {
    return this.http
      .post<any>(this.apiUrl, user, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data as User;
          }
          return response as User;
        })
      );
  }

  updateUser(id: number | string, user: UserUpdate): Observable<User> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, user, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data as User;
          }
          return response as User;
        })
      );
  }

  deleteUser(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      withCredentials: true,
    });
  }

  activateUser(id: number | string): Observable<User> {
    return this.http
      .patch<any>(
        `${this.apiUrl}/${id}/activate`,
        {},
        {
          withCredentials: true,
        }
      )
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data as User;
          }
          return response as User;
        })
      );
  }

  deactivateUser(id: number | string): Observable<User> {
    return this.http
      .patch<any>(
        `${this.apiUrl}/${id}/deactivate`,
        {},
        {
          withCredentials: true,
        }
      )
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data as User;
          }
          return response as User;
        })
      );
  }

  toggleStatus(id: string | number, status: boolean): Observable<User> {
    return status ? this.activateUser(id) : this.deactivateUser(id);
  }

  // Método para obter ranking do usuário
  getUserRanking(userId: string | number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/${userId}/ranking`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  // Método para obter palpites do usuário
  getUserPalpites(userId: string | number, page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http
      .get<any>(`${this.apiUrl}/${userId}/palpites`, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  // Método para obter transações do usuário
  getUserTransacoes(
    userId: string | number,
    page: number = 1,
    limit: number = 10
  ): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http
      .get<any>(`${this.apiUrl}/${userId}/transacoes`, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  // Método para gerenciar premium
  togglePremium(userId: string | number, enable: boolean): Observable<User> {
    const action = enable ? 'activate' : 'deactivate';
    return this.http
      .post<any>(
        `${this.apiUrl}/${userId}/premium/${action}`,
        {},
        {
          withCredentials: true,
        }
      )
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data as User;
          }
          return response as User;
        })
      );
  }

  // Método para adicionar/remover moedas
  updateUserMoedas(userId: string | number, amount: number, description: string): Observable<User> {
    return this.http
      .post<any>(
        `${this.apiUrl}/${userId}/moedas`,
        {
          quantidade: amount,
          descricao: description,
        },
        {
          withCredentials: true,
        }
      )
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data as User;
          }
          return response as User;
        })
      );
  }

  // Método para atualizar status premium
  updateUserPremium(userId: string | number, isPremium: boolean): Observable<User> {
    return this.togglePremium(userId, isPremium);
  }

  // Estatísticas gerais
  getUserStats(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/stats`, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data;
          }
          return response;
        })
      );
  }

  // Verificar se token expirou (método auxiliar para compatibilidade)
  isTokenExpired(): boolean {
    // Implementação básica - em uma aplicação real, verificaria o token JWT
    return false;
  }
}
