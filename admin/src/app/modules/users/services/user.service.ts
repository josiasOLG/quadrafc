import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  User,
  UserCreate,
  UserFilters,
  UserListResponse,
  UserUpdate,
} from '../../../shared/models/user.model';
import { UserStateService } from '../state/user-state.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private userState = inject(UserStateService);

  constructor(private http: HttpClient) {}

  private mapUserData(userData: any): User {
    return {
      ...userData,
      id: userData._id || userData.id,
      dataNascimento: userData.data_nascimento || userData.dataNascimento,
      ativo: userData.ativo !== undefined ? userData.ativo : true,
      banned: userData.banned !== undefined ? userData.banned : false,
    };
  }

  private hasSearchFilters(filters: UserFilters): boolean {
    return !!(
      filters.nome ||
      filters.email ||
      filters.bairro ||
      filters.cidade ||
      filters.ativo !== undefined ||
      filters.assinaturaPremium !== undefined ||
      filters.banned !== undefined ||
      filters.isAdmin !== undefined
    );
  }

  private searchUsers(filters: UserFilters): Observable<UserListResponse> {
    return this.http
      .post<any>(`${this.apiUrl}/search`, filters, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data && response.pagination) {
            return {
              users: response.data.map((user: any) => this.mapUserData(user)),
              total: response.pagination.total,
              page: response.pagination.page,
              limit: response.pagination.limit,
            } as UserListResponse;
          }
          return response as UserListResponse;
        })
      );
  }

  getUsers(filters?: UserFilters): Observable<UserListResponse> {
    if (filters && this.hasSearchFilters(filters)) {
      return this.searchUsers(filters);
    }

    let params = new HttpParams();
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http
      .get<any>(this.apiUrl, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data && response.pagination) {
            const users = response.data.map((user: any) => this.mapUserData(user));

            return {
              users,
              total: response.pagination.total,
              page: response.pagination.page,
              limit: response.pagination.limit,
            } as UserListResponse;
          }
          return response as UserListResponse;
        }),
        tap((result: UserListResponse) => {
          if (filters?.page === 1 || !filters?.page) {
            this.userState.setUsers(result.users);
          } else {
            this.userState.addUsers(result.users);
          }
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
          if (response.data) {
            return this.mapUserData(response.data);
          }
          return this.mapUserData(response);
        }),
        tap((user: User) => {
          this.userState.updateUser(user);
        })
      );
  }

  getUserById(id: string | number): Observable<User> {
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
            return this.mapUserData(response.data);
          }
          return this.mapUserData(response);
        }),
        tap((newUser: User) => {
          this.userState.addUser(newUser);
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
            return this.mapUserData(response.data);
          }
          return this.mapUserData(response);
        }),
        tap((updatedUser: User) => {
          this.userState.updateUser(updatedUser);
        })
      );
  }

  deleteUser(id: number | string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`, {
        withCredentials: true,
      })
      .pipe(
        tap(() => {
          this.userState.removeUser(id);
        })
      );
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
            return {
              ...response.data,
              id: response.data._id,
              dataNascimento: response.data.data_nascimento,
              ativo: true,
              banned: false,
            } as User;
          }
          return {
            ...response,
            id: response._id,
            dataNascimento: response.data_nascimento,
            ativo: true,
            banned: false,
          } as User;
        }),
        tap((updatedUser: User) => {
          this.userState.updateUser(updatedUser);
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
            return {
              ...response.data,
              id: response.data._id,
              dataNascimento: response.data.data_nascimento,
              ativo: false,
              banned: false,
            } as User;
          }
          return {
            ...response,
            id: response._id,
            dataNascimento: response.data_nascimento,
            ativo: false,
            banned: false,
          } as User;
        }),
        tap((updatedUser: User) => {
          this.userState.updateUser(updatedUser);
        })
      );
  }

  toggleStatus(id: string | number, status: boolean): Observable<User> {
    return status ? this.activateUser(id) : this.deactivateUser(id);
  }

  getUserPalpites(userId: string | number, page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http
      .get<any>(`${environment.apiUrl}/palpites/user/${userId}`, {
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

  updateUserPremium(userId: string | number, enable: boolean): Observable<User> {
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
        }),
        tap((updatedUser: User) => {
          this.userState.updateUser(updatedUser);
        })
      );
  }

  getUserRankingDetailed(userId: string | number): Observable<any> {
    return this.http
      .get<any>(`${environment.apiUrl}/ranking/user/${userId}`, {
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

  getUserConquistas(userId: string | number): Observable<any> {
    return this.http
      .get<any>(`${environment.apiUrl}/conquistas/user/${userId}`, {
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

  resetUserPassword(userId: string | number, newPassword: string): Observable<User> {
    return this.http
      .patch<any>(
        `${this.apiUrl}/${userId}/reset-password`,
        { password: newPassword },
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

  addUserMedal(userId: string | number, medalType: string): Observable<User> {
    return this.http
      .post<any>(
        `${this.apiUrl}/${userId}/medals`,
        { medalType },
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
        }),
        tap((updatedUser: User) => {
          this.userState.updateUser(updatedUser);
        })
      );
  }

  adjustUserPoints(userId: string | number, points: number, reason: string): Observable<User> {
    return this.http
      .patch<any>(
        `${this.apiUrl}/${userId}/points`,
        { points, reason },
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
        }),
        tap((updatedUser: User) => {
          this.userState.updateUser(updatedUser);
        })
      );
  }

  toggleUserBan(userId: string | number, banned: boolean, reason?: string): Observable<User> {
    const action = banned ? 'ban' : 'unban';
    return this.http
      .patch<any>(`${this.apiUrl}/${userId}/${action}`, reason ? { reason } : {}, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.data) {
            return response.data as User;
          }
          return response as User;
        }),
        tap((updatedUser: User) => {
          this.userState.updateUser(updatedUser);
        })
      );
  }

  exportUserData(userId: string | number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${userId}/export`, {
      withCredentials: true,
      responseType: 'blob',
    });
  }

  getUserActivityLogs(
    userId: string | number,
    page: number = 1,
    limit: number = 10
  ): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http
      .get<any>(`${this.apiUrl}/${userId}/activity`, {
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
        }),
        tap((updatedUser: User) => {
          this.userState.updateUser(updatedUser);
        })
      );
  }
}
