import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { User } from '../../../../shared/schemas/user.schema';
import { GlobalDialogService } from '../../../../shared/services/global-dialog.service';
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
  private readonly router = inject(Router);
  private readonly globalDialogService = inject(GlobalDialogService);
  private cdr = inject(ChangeDetectorRef);

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

        // Reinicializar configurações quando o usuário mudar
        this.initConfiguracoes();
      }
    });
  }

  private initConfiguracoes(): void {
    this.configuracoes = [
      // Privacidade
      {
        id: 'profile-visibility',
        titulo: 'Perfil Público',
        descricao: 'Aparecer no ranking público de usuários',
        tipo: 'switch',
        valor: this.user?.isPublicProfile ?? true,
        icone: 'pi pi-eye',
        categoria: 'Privacidade',
      },

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
      case 'profile-visibility':
        this.handleProfileVisibilityChange(valor as boolean);
        break;
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
    this.globalDialogService.show({
      type: 'success',
      title: 'Tema alterado',
      message: `Tema alterado para ${tema}`,
      actions: [
        {
          label: 'OK',
          severity: 'primary',
          action: () => this.globalDialogService.hide(),
        },
      ],
    });
  }

  private alterarIdioma(idioma: string): void {
    this.globalDialogService.show({
      type: 'success',
      title: 'Idioma alterado',
      message: `Idioma alterado para ${idioma}`,
      actions: [
        {
          label: 'OK',
          severity: 'primary',
          action: () => this.globalDialogService.hide(),
        },
      ],
    });
  }

  private downloadDados(): void {
    this.globalDialogService.show({
      type: 'info',
      title: 'Download iniciado',
      message: 'Download dos dados iniciado',
      actions: [
        {
          label: 'OK',
          severity: 'primary',
          action: () => this.globalDialogService.hide(),
        },
      ],
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

  private async logout(): Promise<void> {
    await this.authService.logout();
    window.location.reload();
  }

  // Métodos dos modais
  saveProfile(): void {
    this.globalDialogService.show({
      type: 'success',
      title: 'Perfil atualizado',
      message: 'Perfil atualizado com sucesso',
      actions: [
        {
          label: 'OK',
          severity: 'primary',
          action: () => this.globalDialogService.hide(),
        },
      ],
    });
    this.showEditProfileModal = false;
  }

  changePassword(): void {
    if (this.changePasswordForm.novaSenha !== this.changePasswordForm.confirmarSenha) {
      this.globalDialogService.show({
        type: 'error',
        title: 'Erro',
        message: 'As senhas não coincidem',
        actions: [
          {
            label: 'OK',
            severity: 'primary',
            action: () => this.globalDialogService.hide(),
          },
        ],
      });
      return;
    }

    this.globalDialogService.show({
      type: 'success',
      title: 'Senha alterada',
      message: 'Senha alterada com sucesso',
      actions: [
        {
          label: 'OK',
          severity: 'primary',
          action: () => this.globalDialogService.hide(),
        },
      ],
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

  private handleProfileVisibilityChange(isPublicProfile: boolean): void {
    if (!isPublicProfile) {
      this.globalDialogService.show({
        type: 'warning',
        title: 'Confirmar alteração',
        message:
          'Tem certeza que deseja tornar seu perfil privado? Perfis privados não aparecem no ranking, mas continuam somando pontos no bairro normalmente.',
        actions: [
          {
            label: 'Cancelar',
            severity: 'secondary',
            action: () => {
              const profileVisibilityConfig = this.configuracoes.find(
                (c) => c.id === 'profile-visibility'
              );
              if (profileVisibilityConfig) {
                profileVisibilityConfig.valor = true;
              }
              this.globalDialogService.hide();
            },
          },
          {
            label: 'Confirmar',
            severity: 'primary',
            action: () => {
              this.updateProfileVisibility(false);
              this.globalDialogService.hide();
            },
          },
        ],
      });
    } else {
      this.updateProfileVisibility(true);
    }
  }

  private updateProfileVisibility(isPublicProfile: boolean): void {
    this.authService.updateProfileVisibility(isPublicProfile).subscribe({
      next: () => {
        const message = isPublicProfile
          ? 'Perfil alterado para público com sucesso! Você precisará fazer login novamente.'
          : 'Perfil alterado para privado com sucesso! Você precisará fazer login novamente.';

        this.globalDialogService.show({
          type: 'success',
          title: 'Perfil atualizado',
          message,
          actions: [
            {
              label: 'OK',
              severity: 'primary',
              action: () => {
                this.globalDialogService.hide();
                this.logout();
              },
            },
          ],
        });
      },
      error: () => {
        const profileVisibilityConfig = this.configuracoes.find(
          (c) => c.id === 'profile-visibility'
        );
        if (profileVisibilityConfig) {
          profileVisibilityConfig.valor = !isPublicProfile;
        }
        this.globalDialogService.show({
          type: 'error',
          title: 'Erro',
          message: 'Erro ao alterar visibilidade do perfil',
          actions: [
            {
              label: 'OK',
              severity: 'primary',
              action: () => this.globalDialogService.hide(),
            },
          ],
        });
      },
    });
  }
}
