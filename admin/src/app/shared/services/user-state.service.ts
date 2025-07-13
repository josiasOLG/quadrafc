import { computed, Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  // Signal para armazenar todos os usuários carregados
  private _users = signal<User[]>([]);

  // Signal para o usuário selecionado
  private _selectedUser = signal<User | null>(null);

  // Signal para indicar se os dados estão carregando
  private _loading = signal<boolean>(false);

  // Signals públicos (readonly)
  public readonly users = this._users.asReadonly();
  public readonly selectedUser = this._selectedUser.asReadonly();
  public readonly loading = this._loading.asReadonly();

  // Computed signal para buscar usuário por ID
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

  // Computed signal para verificar se temos usuários em cache
  public hasUsers = computed(() => this._users().length > 0);

  /**
   * Atualiza a lista completa de usuários
   */
  setUsers(users: User[]): void {
    this._users.set(users);
  }

  /**
   * Adiciona usuários à lista existente (para paginação)
   */
  addUsers(users: User[]): void {
    const currentUsers = this._users();
    const newUsers = [...currentUsers];

    users.forEach((user) => {
      const existingIndex = newUsers.findIndex((u) => u.id === user.id || u._id === user._id);

      if (existingIndex >= 0) {
        newUsers[existingIndex] = user; // Atualiza se já existe
      } else {
        newUsers.push(user); // Adiciona se não existe
      }
    });

    this._users.set(newUsers);
  }

  /**
   * Seleciona um usuário específico
   */
  selectUser(user: User): void {
    this._selectedUser.set(user);
  }

  /**
   * Seleciona usuário por ID (busca no cache)
   */
  selectUserById(id: string | number): User | null {
    const userFinder = this.getUserById();
    const user = userFinder(id);

    if (user) {
      this._selectedUser.set(user);
      return user;
    }

    return null;
  }

  /**
   * Atualiza um usuário específico na lista
   */
  updateUser(updatedUser: User): void {
    const currentUsers = this._users();
    const updatedUsers = currentUsers.map((user) => {
      if (user.id === updatedUser.id || user._id === updatedUser._id) {
        return { ...user, ...updatedUser };
      }
      return user;
    });

    this._users.set(updatedUsers);

    // Se o usuário atualizado é o selecionado, atualiza também
    const selected = this._selectedUser();
    if (selected && (selected.id === updatedUser.id || selected._id === updatedUser._id)) {
      this._selectedUser.set({ ...selected, ...updatedUser });
    }
  }

  /**
   * Remove um usuário da lista
   */
  removeUser(id: string | number): void {
    const currentUsers = this._users();
    const filteredUsers = currentUsers.filter(
      (user) =>
        user.id !== id && user._id !== id && user.id !== id.toString() && user._id !== id.toString()
    );

    this._users.set(filteredUsers);

    // Se o usuário removido era o selecionado, limpa a seleção
    const selected = this._selectedUser();
    if (selected && (selected.id === id || selected._id === id)) {
      this._selectedUser.set(null);
    }
  }

  /**
   * Adiciona um novo usuário à lista
   */
  addUser(newUser: User): void {
    const currentUsers = this._users();
    this._users.set([newUser, ...currentUsers]);
  }

  /**
   * Limpa o usuário selecionado
   */
  clearSelectedUser(): void {
    this._selectedUser.set(null);
  }

  /**
   * Limpa todos os dados
   */
  clearAll(): void {
    this._users.set([]);
    this._selectedUser.set(null);
    this._loading.set(false);
  }

  /**
   * Define o estado de loading
   */
  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }
}
