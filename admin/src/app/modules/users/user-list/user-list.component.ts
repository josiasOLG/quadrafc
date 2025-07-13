import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { User, UserFilters } from '../../../shared/models/user.model';
import { UserService } from '../services/user.service';
import { UserStateService } from '../state/user-state.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    ChipModule,
    ConfirmDialogModule,
    ToastModule,
    CardModule,
    ToolbarModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  selectedUsers: User[] = [];
  loading = false;
  totalRecords = 0;
  rows = 10;

  // Filtros
  filters: UserFilters = {
    page: 1,
    limit: 10,
  };

  searchTerm = '';
  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Ativo', value: true },
    { label: 'Inativo', value: false },
  ];

  premiumOptions = [
    { label: 'Todos', value: null },
    { label: 'Premium', value: true },
    { label: 'Gratuito', value: false },
  ];

  adminOptions = [
    { label: 'Todos', value: null },
    { label: 'Administrador', value: true },
    { label: 'Usuário', value: false },
  ];

  banOptions = [
    { label: 'Todos', value: null },
    { label: 'Banido', value: true },
    { label: 'Liberado', value: false },
  ];

  constructor(
    private userService: UserService,
    private userStateService: UserStateService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;

    this.userService.getUsers(this.filters).subscribe({
      next: (response) => {
        this.users = response.users;
        this.totalRecords = response.total;
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar usuários',
        });
        this.loading = false;
      },
    });
  }

  onPageChange(event: TableLazyLoadEvent) {
    if (
      event.first !== undefined &&
      event.first !== null &&
      event.rows !== undefined &&
      event.rows !== null
    ) {
      this.filters.page = event.first / event.rows + 1;
      this.filters.limit = event.rows;
      this.loadUsers();
    }
  }

  onSearch() {
    this.filters.nome = this.searchTerm || undefined;
    this.filters.page = 1;
    this.loadUsers();
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadUsers();
  }

  clearFilters() {
    this.filters = { page: 1, limit: 10 };
    this.searchTerm = '';
    this.loadUsers();
  }

  createUser() {
    this.router.navigate(['/users/create']);
  }

  editUser(user: User) {
    this.userStateService.selectUser(user);
    const userId = user._id || user.id;
    this.router.navigate(['/users/edit', userId]);
  }

  viewUser(user: User) {
    this.userStateService.selectUser(user);
    const userId = user._id || user.id;
    this.router.navigate(['/users/view', userId]);
  }

  toggleUserStatus(user: User) {
    const userId = user._id || user.id;
    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID do usuário não encontrado',
      });
      return;
    }

    const action = user.ativo ? 'desativar' : 'ativar';

    this.confirmationService.confirm({
      message: `Tem certeza que deseja ${action} o usuário ${user.nome}?`,
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const operation = user.ativo
          ? this.userService.deactivateUser(userId)
          : this.userService.activateUser(userId);

        operation.subscribe({
          next: (updatedUser) => {
            const index = this.users.findIndex((u) => (u._id || u.id) === userId);
            if (index !== -1) {
              this.users[index] = updatedUser;
              this.userStateService.updateUser(updatedUser);
            }
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: `Usuário ${action}do com sucesso`,
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: `Erro ao ${action} usuário`,
            });
          },
        });
      },
    });
  }

  togglePremium(user: User) {
    const userId = user._id || user.id;
    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID do usuário não encontrado',
      });
      return;
    }

    const newStatus = !(user.assinaturaPremium || user.isPremium);
    const action = newStatus ? 'ativar' : 'desativar';

    this.confirmationService.confirm({
      message: `Tem certeza que deseja ${action} o premium do usuário ${user.nome}?`,
      header: 'Confirmação Premium',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userService.updateUserPremium(userId, newStatus).subscribe({
          next: (updatedUser) => {
            const index = this.users.findIndex((u) => (u._id || u.id) === userId);
            if (index !== -1) {
              this.users[index] = updatedUser;
            }
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: `Premium ${action}do com sucesso`,
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Erro ao atualizar premium',
            });
          },
        });
      },
    });
  }

  deleteUser(user: User) {
    const userId = user._id || user.id;
    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID do usuário não encontrado',
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir o usuário ${user.nome}? Esta ação não pode ser desfeita.`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.deleteUser(userId).subscribe({
          next: () => {
            this.users = this.users.filter((u) => (u._id || u.id) !== userId);
            this.totalRecords--;
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Usuário excluído com sucesso',
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Erro ao excluir usuário',
            });
          },
        });
      },
    });
  }

  getStatusSeverity(
    ativo: boolean
  ): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    return ativo ? 'success' : 'danger';
  }

  getPremiumSeverity(
    premium: boolean
  ): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    return premium ? 'warning' : 'info';
  }

  getBanSeverity(
    banned: boolean
  ): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    return banned ? 'danger' : 'success';
  }

  getAdminSeverity(
    isAdmin: boolean
  ): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    return isAdmin ? 'warning' : 'secondary';
  }

  // Métodos de ação em lote
  exportSelectedUsers() {
    if (this.selectedUsers.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Selecione pelo menos um usuário para exportar',
      });
      return;
    }

    const csvData = this.generateCsvData(this.selectedUsers);
    this.downloadCsv(csvData, 'usuarios_selecionados.csv');
  }

  exportAllUsers() {
    const csvData = this.generateCsvData(this.users);
    this.downloadCsv(csvData, 'todos_usuarios.csv');
  }

  private generateCsvData(users: User[]): string {
    const headers = [
      'Nome',
      'Email',
      'Cidade',
      'Estado',
      'Pontos',
      'Moedas',
      'Premium',
      'Ativo',
      'Data Cadastro',
    ];

    const rows = users.map((user) => [
      user.nome || '',
      user.email || '',
      user.cidade || '',
      user.estado || '',
      (user.totalPoints || user.totalPontos || 0).toString(),
      (user.moedas || user.totalMoedas || 0).toString(),
      user.assinaturaPremium ? 'Sim' : 'Não',
      user.ativo ? 'Ativo' : 'Inativo',
      user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '',
    ]);

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  }

  private downloadCsv(csvData: string, filename: string) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  bulkActivateUsers() {
    if (this.selectedUsers.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Selecione pelo menos um usuário',
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Tem certeza que deseja ativar ${this.selectedUsers.length} usuário(s)?`,
      header: 'Confirmar Ativação em Lote',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.processBulkAction('activate');
      },
    });
  }

  bulkDeactivateUsers() {
    if (this.selectedUsers.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Selecione pelo menos um usuário',
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Tem certeza que deseja desativar ${this.selectedUsers.length} usuário(s)?`,
      header: 'Confirmar Desativação em Lote',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.processBulkAction('deactivate');
      },
    });
  }

  private processBulkAction(action: 'activate' | 'deactivate') {
    const promises = this.selectedUsers.map((user) => {
      const userId = user._id || user.id;
      if (!userId) return Promise.resolve();

      return action === 'activate'
        ? this.userService.activateUser(userId).toPromise()
        : this.userService.deactivateUser(userId).toPromise();
    });

    Promise.all(promises)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `${this.selectedUsers.length} usuário(s) ${
            action === 'activate' ? 'ativado(s)' : 'desativado(s)'
          } com sucesso`,
        });
        this.selectedUsers = [];
        this.loadUsers();
      })
      .catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: `Erro ao ${action === 'activate' ? 'ativar' : 'desativar'} usuários`,
        });
      });
  }

  formatDate(date: string | Date): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  }
}
