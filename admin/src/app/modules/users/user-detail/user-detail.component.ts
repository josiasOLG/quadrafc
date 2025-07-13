import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

import {
  User,
  UserActivityLog,
  UserConquista,
  UserPalpite,
  UserRanking,
  UserTransacao,
} from '../../../shared/models/user.model';
import { UserService } from '../services/user.service';
import { UserStateService } from '../state/user-state.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    ChipModule,
    AvatarModule,
    SkeletonModule,
    ToastModule,
    ToolbarModule,
    DialogModule,
    ConfirmDialogModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  loading = true;
  userId: string;

  // Dados das abas
  palpites: UserPalpite[] = [];
  rankings: UserRanking[] = [];
  transacoes: UserTransacao[] = [];
  conquistas: UserConquista[] = [];
  activityLogs: UserActivityLog[] = [];

  // Estados de carregamento das abas
  loadingPalpites = false;
  loadingRankings = false;
  loadingTransacoes = false;
  loadingConquistas = false;
  loadingActivity = false;

  // Dialogs
  showPasswordDialog = false;
  showMoedasDialog = false;
  showPontosDialog = false;
  showMedalDialog = false;
  showBanDialog = false;

  // Formulários dos dialogs
  newPassword = '';
  moedaAmount = 0;
  moedaDescription = '';
  pontosAmount = 0;
  pontosReason = '';
  medalType = '';
  banReason = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private userStateService: UserStateService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.userId = this.route.snapshot.params['id'];
  }

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    // 🚀 SOLUÇÃO AVANÇADA: Busca SEMPRE no cache primeiro
    const cachedUser = this.userStateService.getCachedUser(this.userId);

    if (cachedUser) {
      // ✅ Usuário encontrado no cache - ZERO requisições ao backend!
      this.user = cachedUser;
      this.userStateService.selectUser(cachedUser);
      this.loading = false;
      return;
    }

    // ⚠️ Fallback: só vai ao backend se NÃO estiver no cache
    // Isso só acontece se o usuário acessar a URL diretamente
    this.loading = true;
    this.userService.getById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.userStateService.forceUpdateUserInCache(user);
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados do usuário',
        });
        this.loading = false;
        this.router.navigate(['/users']);
      },
    });
  }

  loadPalpites() {
    if (this.palpites.length > 0) return;

    this.loadingPalpites = true;

    this.userService.getUserPalpites(this.userId, 1, 50).subscribe({
      next: (response) => {
        this.palpites = response.palpites || response.data || response;
        this.loadingPalpites = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar palpites do usuário',
        });
        this.loadingPalpites = false;
      },
    });
  }

  loadRankings() {
    if (this.rankings.length > 0) return;

    this.loadingRankings = true;

    this.userService.getUserRankingDetailed(this.userId).subscribe({
      next: (response) => {
        this.rankings = response.rankings || response.data || response;
        this.loadingRankings = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar rankings do usuário',
        });
        this.loadingRankings = false;
      },
    });
  }

  loadTransacoes() {
    if (this.transacoes.length > 0) return;

    this.loadingTransacoes = true;

    this.userService.getUserTransacoes(this.userId, 1, 50).subscribe({
      next: (response) => {
        this.transacoes = response.transacoes || response.data || response;
        this.loadingTransacoes = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar transações do usuário',
        });
        this.loadingTransacoes = false;
      },
    });
  }

  loadConquistas() {
    if (this.conquistas.length > 0) return;

    this.loadingConquistas = true;

    this.userService.getUserConquistas(this.userId).subscribe({
      next: (response) => {
        this.conquistas = response.conquistas || response.data || response;
        this.loadingConquistas = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar conquistas do usuário',
        });
        this.loadingConquistas = false;
      },
    });
  }

  loadActivityLogs() {
    if (this.activityLogs.length > 0) return;

    this.loadingActivity = true;

    this.userService.getUserActivityLogs(this.userId, 1, 50).subscribe({
      next: (response) => {
        this.activityLogs = response.logs || response.data || response;
        this.loadingActivity = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar logs de atividade',
        });
        this.loadingActivity = false;
      },
    });
  }

  onTabChange(event: { index: number }) {
    const index = event.index;

    switch (index) {
      case 1:
        this.loadPalpites();
        break;
      case 2:
        this.loadRankings();
        break;
      case 3:
        this.loadTransacoes();
        break;
      case 4:
        this.loadConquistas();
        break;
      case 5:
        this.loadActivityLogs();
        break;
    }
  }

  // Métodos administrativos
  resetPassword() {
    if (!this.newPassword.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Digite uma nova senha',
      });
      return;
    }

    this.userService.resetUserPassword(this.userId, this.newPassword).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Senha resetada com sucesso',
        });
        this.showPasswordDialog = false;
        this.newPassword = '';
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao resetar senha',
        });
      },
    });
  }

  updateMoedas() {
    if (!this.moedaDescription.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Digite uma descrição para a transação',
      });
      return;
    }

    this.userService
      .updateUserMoedas(this.userId, this.moedaAmount, this.moedaDescription)
      .subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Moedas atualizadas com sucesso',
          });
          this.showMoedasDialog = false;
          this.moedaAmount = 0;
          this.moedaDescription = '';
          this.transacoes = [];
          this.loadTransacoes();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao atualizar moedas',
          });
        },
      });
  }

  adjustPoints() {
    if (!this.pontosReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Digite o motivo do ajuste',
      });
      return;
    }

    this.userService.adjustUserPoints(this.userId, this.pontosAmount, this.pontosReason).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Pontuação ajustada com sucesso',
        });
        this.showPontosDialog = false;
        this.pontosAmount = 0;
        this.pontosReason = '';
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao ajustar pontuação',
        });
      },
    });
  }

  addMedal() {
    if (!this.medalType.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Digite o tipo da medalha',
      });
      return;
    }

    this.userService.addUserMedal(this.userId, this.medalType).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Medalha concedida com sucesso',
        });
        this.showMedalDialog = false;
        this.medalType = '';
        this.conquistas = [];
        this.loadConquistas();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao conceder medalha',
        });
      },
    });
  }

  toggleBan() {
    const isBanned = this.user?.banned || false;
    const action = isBanned ? 'desbanir' : 'banir';

    this.confirmationService.confirm({
      message: `Tem certeza que deseja ${action} o usuário ${this.user?.nome}?`,
      header: `Confirmar ${action}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: isBanned ? 'p-button-success' : 'p-button-danger',
      accept: () => {
        this.userService.toggleUserBan(this.userId, !isBanned, this.banReason).subscribe({
          next: (updatedUser) => {
            this.user = updatedUser;
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: `Usuário ${action}do com sucesso`,
            });
            this.showBanDialog = false;
            this.banReason = '';
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

  exportUserData() {
    this.userService.exportUserData(this.userId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `usuario_${this.user?.nome}_dados.json`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Dados exportados com sucesso',
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao exportar dados',
        });
      },
    });
  }

  toggleUserStatus() {
    if (!this.user) return;

    const newStatus = !this.user.ativo;

    this.userService.toggleStatus(this.user.id!, newStatus).subscribe({
      next: () => {
        this.user!.ativo = newStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
        });
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao alterar status do usuário',
        });
      },
    });
  }

  editUser() {
    this.router.navigate(['/users/edit', this.userId]);
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  getStatusSeverity(ativo: boolean): 'success' | 'danger' {
    return ativo ? 'success' : 'danger';
  }

  getPremiumStatusSeverity(premium: boolean): 'success' | 'secondary' {
    return premium ? 'success' : 'secondary';
  }

  getBanStatusSeverity(banned: boolean): 'danger' | 'success' {
    return banned ? 'danger' : 'success';
  }

  getPalpiteStatusSeverity(status: string): 'success' | 'danger' | 'warning' | 'secondary' {
    switch (status) {
      case 'acertou':
        return 'success';
      case 'errou':
        return 'danger';
      case 'pendente':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  getTransacaoSeverity(tipo: string): 'success' | 'danger' | 'info' | 'warning' {
    switch (tipo) {
      case 'ganho':
      case 'bonus':
        return 'success';
      case 'gasto':
        return 'danger';
      case 'premium':
        return 'warning';
      case 'ajuste':
        return 'info';
      default:
        return 'info';
    }
  }

  getRankingColor(posicao: number): string {
    if (posicao <= 3) return '#ffd700';
    if (posicao <= 10) return '#c0c0c0';
    if (posicao <= 50) return '#cd7f32';
    return '#6c757d';
  }

  formatDate(date: string | Date): string {
    if (!date) return 'Não informado';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
}
