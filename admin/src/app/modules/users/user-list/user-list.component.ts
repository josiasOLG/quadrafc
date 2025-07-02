import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { User, UserFilters } from '../../../shared/models/user.model';
import { UserService } from '../../../shared/services/user.service';

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

  constructor(
    private userService: UserService,
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
        console.error('Erro ao carregar usuários:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar usuários',
        });
        this.loading = false;
      },
    });
  }

  onPageChange(event: any) {
    this.filters.page = event.first / event.rows + 1;
    this.filters.limit = event.rows;
    this.loadUsers();
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
    const userId = user._id || user.id;
    this.router.navigate(['/users/edit', userId]);
  }

  viewUser(user: User) {
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
            }
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: `Usuário ${action}do com sucesso`,
            });
          },
          error: (error) => {
            console.error(`Erro ao ${action} usuário:`, error);
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
            console.error('Erro ao atualizar premium:', error);
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
            console.error('Erro ao excluir usuário:', error);
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
}
