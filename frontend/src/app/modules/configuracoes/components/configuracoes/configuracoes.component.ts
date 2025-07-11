import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { User } from '../../../../shared/schemas/user.schema';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';

interface ConfiguracaoItem {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'switch' | 'dropdown' | 'button' | 'input';
  valor?: string | boolean | number;
  opcoes?: { label: string; value: string | boolean | number }[];
  icone: string;
  categoria: string;
}

@Component({
  selector: 'app-configuracoes',
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.scss'],
})
export class ConfiguracoesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  user: User | null = null;
  configuracoes: ConfiguracaoItem[] = [];

  // Modais
  showEditProfileModal = false;
  showChangePasswordModal = false;
  showNotificationModal = false;
  showLogoutConfirm = false;
  logoutLoading = false;

  // Dados do modal de confirmação de logout
  logoutConfirmData: ConfirmDialogData = {
    title: 'Confirmar Logout',
    message:
      'Tem certeza que deseja sair da sua conta?<br><small class="text-600">Você precisará fazer login novamente para acessar o app.</small>',
    confirmText: 'Sair',
    cancelText: 'Cancelar',
    confirmIcon: 'pi pi-sign-out',
    cancelIcon: 'pi pi-times',
    severity: 'warn',
  };

  // Forms
  editProfileForm = {
    nome: '',
    email: '',
    cidade: '',
    estado: '',
    bairro: '',
  };

  changePasswordForm = {
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  };

  // Opções para dropdowns
  temasDisponiveis = [
    { label: 'Claro', value: 'light' },
    { label: 'Escuro', value: 'dark' },
    { label: 'Automático', value: 'auto' },
  ];

  idiomasDisponiveis = [
    { label: 'Português (BR)', value: 'pt-BR' },
    { label: 'English', value: 'en-US' },
    { label: 'Español', value: 'es-ES' },
  ];

  ngOnInit(): void {
    this.loadUser();
    this.initConfiguracoes();
  }

  private loadUser(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.user = user;
      if (user) {
        this.editProfileForm = {
          nome: user.nome || '',
          email: user.email || '',
          cidade: '',
          estado: '',
          bairro: user.bairro || '',
        };
      }
    });
  }

  private initConfiguracoes(): void {
    this.configuracoes = [
      // Perfil
      // {
      //   id: 'edit-profile',
      //   titulo: 'Editar Perfil',
      //   descricao: 'Altere suas informações pessoais',
      //   tipo: 'button',
      //   icone: 'pi pi-user-edit',
      //   categoria: 'Perfil',
      // },
      // {
      //   id: 'change-password',
      //   titulo: 'Alterar Senha',
      //   descricao: 'Modifique sua senha de acesso',
      //   tipo: 'button',
      //   icone: 'pi pi-key',
      //   categoria: 'Perfil',
      // },

      // Loja Premium
      // {
      //   id: 'premium-store',
      //   titulo: 'Loja Premium',
      //   descricao: 'Compre acesso a rankings de cidades, estados ou assine o Premium',
      //   tipo: 'button',
      //   icone: 'pi pi-star',
      //   categoria: 'Premium',
      // },

      // Notificações
      // {
      //   id: 'notif-jogos',
      //   titulo: 'Notificações de Jogos',
      //   descricao: 'Receba alertas sobre novos jogos',
      //   tipo: 'switch',
      //   valor: true,
      //   icone: 'pi pi-bell',
      //   categoria: 'Notificações',
      // },
      // {
      //   id: 'notif-ranking',
      //   titulo: 'Notificações de Ranking',
      //   descricao: 'Alertas sobre mudanças no ranking',
      //   tipo: 'switch',
      //   valor: true,
      //   icone: 'pi pi-trophy',
      //   categoria: 'Notificações',
      // },
      // {
      //   id: 'notif-email',
      //   titulo: 'Notificações por Email',
      //   descricao: 'Receba resumos por email',
      //   tipo: 'switch',
      //   valor: false,
      //   icone: 'pi pi-envelope',
      //   categoria: 'Notificações',
      // },

      // Privacidade
      // {
      //   id: 'perfil-publico',
      //   titulo: 'Perfil Público',
      //   descricao: 'Permitir que outros vejam seu perfil',
      //   tipo: 'switch',
      //   valor: true,
      //   icone: 'pi pi-eye',
      //   categoria: 'Privacidade',
      // },
      // {
      //   id: 'mostrar-estatisticas',
      //   titulo: 'Mostrar Estatísticas',
      //   descricao: 'Exibir suas estatísticas no ranking',
      //   tipo: 'switch',
      //   valor: true,
      //   icone: 'pi pi-chart-bar',
      //   categoria: 'Privacidade',
      // },

      // Conta
      {
        id: 'logout',
        titulo: 'Sair da Conta',
        descricao: 'Fazer logout da aplicação',
        tipo: 'button',
        icone: 'pi pi-sign-out',
        categoria: 'Conta',
      },
    ];
  }

  getConfiguracoesPorCategoria(categoria: string): ConfiguracaoItem[] {
    return this.configuracoes.filter((config) => config.categoria === categoria);
  }

  getCategorias(): string[] {
    return [...new Set(this.configuracoes.map((config) => config.categoria))];
  }

  onConfigChange(item: ConfiguracaoItem, valor: string | boolean | number): void {
    item.valor = valor;

    switch (item.id) {
      case 'tema':
        this.aplicarTema(valor as string);
        break;
      case 'idioma':
        this.alterarIdioma(valor as string);
        break;
      default:
        this.salvarConfiguracao(item.id, valor);
    }
  }

  onButtonClick(item: ConfiguracaoItem): void {
    switch (item.id) {
      case 'edit-profile':
        this.showEditProfileModal = true;
        break;
      case 'change-password':
        this.showChangePasswordModal = true;
        break;
      case 'download-dados':
        this.downloadDados();
        break;
      case 'logout':
        this.confirmLogout();
        break;
      case 'premium-store':
        this.router.navigate(['/premium-store']);
        break;
    }
  }

  private aplicarTema(tema: string): void {
    // Implementar mudança de tema
    this.toastService.show({
      detail: `Tema alterado para ${tema}`,
      severity: 'success',
    });
  }

  private alterarIdioma(idioma: string): void {
    // Implementar mudança de idioma
    this.toastService.show({
      detail: `Idioma alterado para ${idioma}`,
      severity: 'success',
    });
  }

  private salvarConfiguracao(_id: string, _valor: string | boolean | number): void {
    // TODO: Implementar salvamento de configurações
  }

  private downloadDados(): void {
    // Implementar download dos dados
    this.toastService.show({
      detail: 'Download dos dados iniciado',
      severity: 'info',
    });
  }

  private confirmLogout(): void {
    this.showLogoutConfirm = true;
  }

  onLogoutConfirm(): void {
    this.logoutLoading = true;
    this.logout();
  }

  onLogoutCancel(): void {
    this.showLogoutConfirm = false;
  }

  private logout(): void {
    // Mostrar loading/confirmação se necessário
    this.toastService.show({
      detail: 'Fazendo logout...',
      severity: 'info',
    });

    this.authService.logout().subscribe({
      next: () => {
        this.clearLocalData();

        // Fechar modal e parar loading
        this.showLogoutConfirm = false;
        this.logoutLoading = false;

        // Mostrar mensagem de sucesso
        this.toastService.show({
          detail: 'Logout realizado com sucesso',
          severity: 'success',
        });

        // Navegar para login e recarregar a página para limpar completamente o estado
        this.router.navigate(['/auth/login'], { replaceUrl: true }).then(() => {
          window.location.reload();
        });
      },
      error: (error) => {
        console.error('Erro no logout:', error);

        // Mesmo com erro, limpar estado local e redirecionar
        this.clearLocalData();

        // Fechar modal e parar loading
        this.showLogoutConfirm = false;
        this.logoutLoading = false;

        this.toastService.show({
          detail: 'Sessão encerrada',
          severity: 'warn',
        });

        // Forçar navegação mesmo com erro
        this.router.navigate(['/auth/login'], { replaceUrl: true }).then(() => {
          window.location.reload();
        });
      },
    });
  }

  private clearLocalData(): void {
    // Limpar dados do componente
    this.user = null;
    this.editProfileForm = {
      nome: '',
      email: '',
      cidade: '',
      estado: '',
      bairro: '',
    };

    // Limpar dados do localStorage como backup (o AuthService já faz isso, mas garantindo)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quadrafc_logged_in');
      localStorage.removeItem('quadrafc_user_data');
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
    }
  }

  // Métodos dos modais
  saveProfile(): void {
    // Implementar salvamento do perfil
    this.toastService.show({
      detail: 'Perfil atualizado com sucesso',
      severity: 'success',
    });
    this.showEditProfileModal = false;
  }

  changePassword(): void {
    if (this.changePasswordForm.novaSenha !== this.changePasswordForm.confirmarSenha) {
      this.toastService.show({
        detail: 'As senhas não coincidem',
        severity: 'error',
      });
      return;
    }

    // Implementar mudança de senha
    this.toastService.show({
      detail: 'Senha alterada com sucesso',
      severity: 'success',
    });
    this.showChangePasswordModal = false;
    this.changePasswordForm = {
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    };
  }

  getAvatarLabel(nome: string): string {
    return nome ? nome.charAt(0).toUpperCase() : 'U';
  }
}
