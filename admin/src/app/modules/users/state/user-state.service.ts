import { computed, Injectable, signal } from '@angular/core';
import { User } from '../../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  private _users = signal<User[]>([]);
  private _selectedUser = signal<User | null>(null);
  private _loading = signal<boolean>(false);

  public readonly users = this._users.asReadonly();
  public readonly selectedUser = this._selectedUser.asReadonly();
  public readonly loading = this._loading.asReadonly();

  public getUserById = computed(() => {
    return (id: string | number) => {
      const usersList = this._users();
      return usersList.find(
        (user) =>
          user.id === id ||
          user._id === id ||
          user.id === id.toString() ||
          user._id === id.toString()
      );
    };
  });

  public hasUsers = computed(() => this._users().length > 0);

  setUsers(users: User[]): void {
    this._users.set(users);
  }

  addUsers(users: User[]): void {
    const currentUsers = this._users();
    const newUsers = [...currentUsers];

    users.forEach((user) => {
      const existingIndex = newUsers.findIndex((u) => u.id === user.id || u._id === user._id);

      if (existingIndex >= 0) {
        newUsers[existingIndex] = user;
      } else {
        newUsers.push(user);
      }
    });

    this._users.set(newUsers);
  }

  selectUser(user: User): void {
    this._selectedUser.set(user);
  }

  selectUserById(id: string | number): User | null {
    const userFinder = this.getUserById();
    const user = userFinder(id);

    if (user) {
      this._selectedUser.set(user);
      return user;
    }

    return null;
  }

  updateUser(updatedUser: User): void {
    const currentUsers = this._users();
    const updatedUsers = currentUsers.map((user) => {
      if (user.id === updatedUser.id || user._id === updatedUser._id) {
        return { ...user, ...updatedUser };
      }
      return user;
    });

    this._users.set(updatedUsers);

    const selected = this._selectedUser();
    if (selected && (selected.id === updatedUser.id || selected._id === updatedUser._id)) {
      this._selectedUser.set({ ...selected, ...updatedUser });
    }
  }

  removeUser(id: string | number): void {
    const currentUsers = this._users();
    const filteredUsers = currentUsers.filter(
      (user) =>
        user.id !== id && user._id !== id && user.id !== id.toString() && user._id !== id.toString()
    );

    this._users.set(filteredUsers);

    const selected = this._selectedUser();
    if (selected && (selected.id === id || selected._id === id)) {
      this._selectedUser.set(null);
    }
  }

  addUser(newUser: User): void {
    const currentUsers = this._users();
    this._users.set([newUser, ...currentUsers]);
  }

  clearSelectedUser(): void {
    this._selectedUser.set(null);
  }

  clearAll(): void {
    this._users.set([]);
    this._selectedUser.set(null);
    this._loading.set(false);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  /**
   * Método avançado: busca do usuário no cache com fallback
   * Retorna o usuário do cache se existir, null se não existir
   */
  getCachedUser(id: string | number): User | null {
    const userFinder = this.getUserById();
    return userFinder(id) || null;
  }

  /**
   * Verifica se o usuário está no cache
   */
  isUserCached(id: string | number): boolean {
    return this.getCachedUser(id) !== null;
  }

  /**
   * Força a atualização de um usuário específico no cache
   */
  forceUpdateUserInCache(user: User): void {
    this.updateUser(user);
    this.selectUser(user);
  }
}
