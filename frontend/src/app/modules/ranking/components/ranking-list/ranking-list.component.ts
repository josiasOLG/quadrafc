import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../../../../core/services/auth.service';
import { PremiumPermissionsService } from '../../../../core/services/premium-permissions.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { User } from '../../../../shared/schemas/user.schema';
import { ToastService } from '../../../../shared/services/toast.service';
import { RankingService } from '../../services/ranking.service';

interface ApiRankingUsuario {
  _id: string;
  name?: string;
  nome?: string;
  username?: string;
  usuario?: string;
  totalPoints?: number;
  pontos?: number;
  pontuacao?: number;
  palpites_corretos?: number;
  total_palpites?: number;
  totalPalpites?: number;
  taxa_acerto?: number;
  taxaAcerto?: number;
  sequencia_atual?: number;
  avatarUrl?: string;
  avatar?: string;
  bairroId?: { nome: string };
  bairro?: string;
  cidade?: string;
  estado?: string;
}

interface ApiRankingBairro {
  _id: string;
  nome: string;
  cidade: string;
  estado: string;
  pontos_totais?: number;
  pontuacaoMedia?: number;
  media_pontuacao?: number;
  usuarios_ativos?: number;
  totalUsuarios?: number;
  taxaAcertoMedia?: number;
  totalPalpites?: number;
}

interface FiltroRanking {
  label: string;
  value: string;
  disponivel: boolean;
  gratuito: boolean;
  custo?: number;
}

interface TabChangeEvent {
  index: number;
  tab: any;
}

interface RankingItem {
  posicao: number;
  usuario: {
    _id: string;
    nome: string;
    avatar?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  pontos: number;
  palpites_corretos: number;
  total_palpites: number;
  taxa_acerto: number;
  sequencia_atual: number;
  isCurrentUser?: boolean;
}

interface RankingBairro {
  posicao: number;
  bairro: {
    nome: string;
    cidade: string;
    estado: string;
  };
  pontos_totais: number;
  usuarios_ativos: number;
  media_pontuacao: number;
}

interface FiltroRanking {
  label: string;
  value: string;
  disponivel: boolean;
  gratuito: boolean;
  custo?: number;
}

@Component({
  selector: 'app-ranking-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TabViewModule,
    DropdownModule,
    BadgeModule,
    AvatarModule,
    ButtonModule,
    SkeletonModule,
    TagModule,
    DialogModule,
    TooltipModule,
    PageHeaderComponent,
    CurrencyFormatPipe,
  ],
  templateUrl: './ranking-list.component.html',
  styleUrls: ['./ranking-list.component.scss'],
})
export class RankingListComponent implements OnInit {
  user: User | null = null;
  rankingUsuarios: RankingItem[] = [];
  rankingBairros: RankingBairro[] = [];
  isLoading = true;
  activeTab = 0;

  // Modal properties
  showUserDetailsModal = false;
  showBairroDetailsModal = false;
  selectedUserDetails: RankingItem | null = null;
  selectedBairroDetails: RankingBairro | null = null;

  // Filtros
  filtroSelecionado: FiltroRanking = {
    label: 'Meu Bairro',
    value: 'bairro',
    disponivel: true,
    gratuito: true,
  };
  filtros: FiltroRanking[] = [
    { label: 'Meu Bairro', value: 'bairro', disponivel: true, gratuito: true },
  ];

  // Dados de acesso premium
  acessosUsuario: {
    assinaturaPremium: boolean;
    dataVencimentoPremium?: Date;
    estadosAcessiveis: string[];
    cidadesAcessiveis: { cidade: string; estado: string }[];
    temAcessoNacional: boolean;
  } | null = null;

  // Custos para compras (obtidos do backend)
  custosAcesso: {
    cidade: number;
    estado: number;
    nacional: number;
    assinaturaPremiumMensal: number;
  } | null = null;

  // Custos padrão (fallback)
  custos = {
    cidade: 100,
    estado: 250,
    nacional: 500,
    assinaturaPremiumMensal: 500,
  };

  // Propriedades para controle premium
  premiumAccess = {
    temAcesso: false,
    custoDesbloqueio: 100,
    verificando: false,
  };
  mostrarDialogPremium = false;

  constructor(
    private rankingService: RankingService,
    private authService: AuthService,
    private toastService: ToastService,
    private premiumPermissionsService: PremiumPermissionsService
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadFiltrosDisponiveis();
    this.loadRankings();
  }

  private loadFiltrosDisponiveis(): void {
    // Primeiro tenta carregar do cache/global
    const permissions = this.premiumPermissionsService.currentPermissions;

    if (permissions) {
      // Se já tem permissões carregadas, usar elas
      this.filtros = permissions.filtros;
      this.acessosUsuario = permissions.acessos;
      this.custosAcesso = permissions.custos;
    } else {
      // Se não tem, carregar do serviço
      this.premiumPermissionsService.loadPermissions().subscribe({
        next: (permissions) => {
          if (permissions) {
            this.filtros = permissions.filtros;
            this.acessosUsuario = permissions.acessos;
            this.custosAcesso = permissions.custos;
          }
        },
        error: () => {
          this.toastService.show({
            detail: 'Erro ao carregar filtros disponíveis',
            severity: 'error',
          });
        },
      });
    }

    // Se o filtro atualmente selecionado não está disponível, selecionar o primeiro disponível
    const filtroAtualDisponivel = this.filtros.find(
      (f) => f.value === this.filtroSelecionado.value && f.disponivel
    );

    if (!filtroAtualDisponivel) {
      this.filtroSelecionado = this.filtros.find((f) => f.disponivel) || this.filtros[0];
    }
  }

  private loadUser(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
  }

  private loadRankings(): void {
    this.isLoading = true;

    // Carregar rankings em paralelo
    Promise.all([this.loadRankingUsuarios(), this.loadRankingBairros()]).finally(() => {
      this.isLoading = false;
    });
  }

  private async loadRankingUsuarios(): Promise<void> {
    try {
      this.rankingService.getRankingUsuarios({ limit: 50 }).subscribe({
        next: (response) => {
          this.rankingUsuarios = response.data.map((item: any, index: number) => ({
            posicao: index + 1,
            usuario: {
              _id: item.usuario || item._id,
              nome: item.name || item.nome || 'Usuário', // Usar 'name' do endpoint, fallback para 'nome'
              avatar: item.avatarUrl || item.avatar,
              bairro: item.bairroId?.nome || item.bairro || '',
              cidade: item.cidade || '',
              estado: item.estado || '',
            },
            pontos: item.totalPoints || item.pontos || item.pontuacao || 0,
            palpites_corretos: item.palpites_corretos || 0,
            total_palpites: item.total_palpites || item.totalPalpites || 0,
            taxa_acerto: item.taxa_acerto || item.taxaAcerto || 0,
            sequencia_atual: item.sequencia_atual || 0,
            isCurrentUser: item.usuario === this.user?._id || item._id === this.user?._id,
          }));
        },
        error: (error) => {
          this.toastService.show({
            detail: 'Erro ao carregar ranking de usuários',
            severity: 'error',
          });
        },
      });
    } catch (error) {
      this.toastService.show({
        detail: 'Erro ao carregar ranking de usuários',
        severity: 'error',
      });
    }
  }

  private async loadRankingBairros(): Promise<void> {
    try {
      this.rankingService.getRankingBairros({ limit: 20 }).subscribe({
        next: (response) => {
          this.rankingBairros = response.data.map((item: any, index: number) => ({
            posicao: index + 1,
            bairro: {
              nome: item.bairro || item.nome,
              cidade: item.cidade,
              estado: item.estado,
            },
            pontos_totais: item.pontos_totais,
            usuarios_ativos: item.usuarios_ativos,
            media_pontuacao: item.media_pontos_usuario || 0,
          }));
        },
        error: (error) => {
          this.toastService.show({
            detail: 'Erro ao carregar ranking de bairros',
            severity: 'error',
          });
        },
      });
    } catch (error) {
      this.toastService.show({
        detail: 'Erro ao carregar ranking de bairros',
        severity: 'error',
      });
    }
  }

  onFiltroChange(): void {
    // Verificar se o filtro selecionado está disponível
    if (!this.filtroSelecionado.disponivel) {
      // Se não está disponível, mostrar dialog de compra
      this.mostrarDialogPremium = true;
      this.premiumAccess.custoDesbloqueio = this.filtroSelecionado.custo || 100;
      return;
    }

    // Se está disponível, carregar os dados baseado no filtro
    this.loadRankingsByFilter();
  }

  private loadRankingsByFilter(): void {
    switch (this.filtroSelecionado.value) {
      case 'bairro':
        this.loadRankings(); // Ranking padrão (usuários e bairros da mesma cidade)
        break;
      case 'cidade':
        this.loadRankingBairrosCidade();
        break;
      case 'estado':
        this.loadRankingEstado();
        break;
      case 'nacional':
        this.loadRankingBairrosNacional();
        break;
      default:
        this.loadRankings();
    }
  }

  private loadRankingEstado(): void {
    // Por enquanto, usar o mesmo endpoint de cidade
    // Quando implementado no backend, pode ser um endpoint específico
    this.loadRankingBairrosCidade();
  }

  onTabChange(event: any): void {
    this.activeTab = event.index;
  }

  getUserMedalha(posicao: number): { icon: string; color: string } | null {
    switch (posicao) {
      case 1:
        return { icon: 'pi-trophy', color: '#FFD700' };
      case 2:
        return { icon: 'pi-award', color: '#C0C0C0' };
      case 3:
        return { icon: 'pi-medal', color: '#CD7F32' };
      default:
        return null;
    }
  }

  getBairroMedalha(posicao: number): { icon: string; color: string } | null {
    switch (posicao) {
      case 1:
        return { icon: 'pi-home', color: '#FFD700' };
      case 2:
        return { icon: 'pi-building', color: '#C0C0C0' };
      case 3:
        return { icon: 'pi-map', color: '#CD7F32' };
      default:
        return null;
    }
  }

  getAvatarLabel(nome: string): string {
    return nome?.charAt(0)?.toUpperCase() || 'U';
  }

  getCurrentUserPosition(): number | null {
    const currentUser = this.rankingUsuarios.find((item) => item.isCurrentUser);
    return currentUser?.posicao || null;
  }

  trackByUsuario(index: number, item: RankingItem): string {
    return item.usuario._id;
  }

  trackByBairro(index: number, item: RankingBairro): string {
    return `${item.bairro.nome}-${item.bairro.cidade}`;
  }

  // Modal methods
  openUserDetailsModal(user: RankingItem): void {
    this.selectedUserDetails = user;
    this.showUserDetailsModal = true;
  }

  closeUserDetailsModal(): void {
    console.log('Fechando modal de usuário');
    this.showUserDetailsModal = false;
    this.selectedUserDetails = null;
  }

  openBairroDetailsModal(bairro: RankingBairro): void {
    this.selectedBairroDetails = bairro;
    this.showBairroDetailsModal = true;
  }

  closeBairroDetailsModal(): void {
    console.log('Fechando modal de bairro');
    this.showBairroDetailsModal = false;
    this.selectedBairroDetails = null;
  }

  // Design helper methods
  getRankingBadgeClass(posicao: number): string {
    switch (posicao) {
      case 1:
        return 'ranking-badge--gold';
      case 2:
        return 'ranking-badge--silver';
      case 3:
        return 'ranking-badge--bronze';
      default:
        return 'ranking-badge--default';
    }
  }

  getStarsArray(taxaAcerto: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  getRatingFromPercent(taxaAcerto: number): number {
    if (taxaAcerto >= 90) return 5;
    if (taxaAcerto >= 75) return 4;
    if (taxaAcerto >= 60) return 3;
    if (taxaAcerto >= 40) return 2;
    if (taxaAcerto >= 20) return 1;
    return 0;
  }

  getBairroRating(item: RankingBairro): number {
    // Rating baseado na quantidade de usuários ativos e média de pontuação
    const userFactor = Math.min(item.usuarios_ativos / 10, 1); // 10+ usuários = fator máximo
    const scoreFactor = Math.min(item.media_pontuacao / 1000, 1); // 1000+ pontos médios = fator máximo
    const totalFactor = (userFactor + scoreFactor) / 2;
    return Math.ceil(totalFactor * 5);
  }

  // Métodos para funcionalidade premium
  async verificarAcessoPremium(): Promise<void> {
    this.premiumAccess.verificando = true;

    try {
      this.rankingService.verificarAcessoPremium().subscribe({
        next: (response) => {
          this.premiumAccess.temAcesso = response.temAcesso;
          this.premiumAccess.custoDesbloqueio = response.custoDesbloqueio || 100;
          this.premiumAccess.verificando = false;
        },
        error: () => {
          this.premiumAccess.verificando = false;
          this.toastService.show({
            detail: 'Erro ao verificar acesso premium',
            severity: 'error',
          });
        },
      });
    } catch (error) {
      this.premiumAccess.verificando = false;
    }
  }

  onFiltroChangeWithPremium(): void {
    if (this.filtroSelecionado.value === 'nacional') {
      // Verificar se tem acesso premium para ranking nacional
      this.verificarAcessoPremium().then(() => {
        if (!this.premiumAccess.temAcesso) {
          this.mostrarDialogPremium = true;
          return;
        }
        this.loadRankingBairrosNacional();
      });
    } else if (this.filtroSelecionado.value === 'cidade') {
      this.loadRankingBairrosCidade();
    } else {
      this.loadRankings();
    }
  }

  async desbloquearRankingNacional(): Promise<void> {
    try {
      this.rankingService.desbloquearRankingNacional().subscribe({
        next: (response) => {
          if (response.sucesso) {
            this.premiumAccess.temAcesso = true;
            this.mostrarDialogPremium = false;

            // Atualizar saldo de moedas do usuário
            if (this.user) {
              this.user.moedas = response.novoSaldoMoedas;
            }

            this.loadRankingBairrosNacional();

            this.toastService.show({
              detail: 'Ranking nacional desbloqueado com sucesso!',
              severity: 'success',
            });
          }
        },
        error: (error) => {
          this.toastService.show({
            detail: error.error?.message || 'Erro ao desbloquear ranking nacional',
            severity: 'error',
          });
        },
      });
    } catch (error) {
      this.toastService.show({
        detail: 'Erro ao desbloquear ranking nacional',
        severity: 'error',
      });
    }
  }

  // Métodos para comprar acesso específico
  async comprarAcessoCidade(): Promise<void> {
    if (!this.user?.bairroId?.cidade || !this.user?.bairroId?.estado) {
      this.toastService.show({
        detail: 'Informações de localização não encontradas',
        severity: 'error',
      });
      return;
    }

    try {
      this.rankingService
        .comprarAcessoCidade(this.user.bairroId.cidade, this.user.bairroId.estado)
        .subscribe({
          next: (response) => {
            if (response.sucesso) {
              this.mostrarDialogPremium = false;

              // Atualizar saldo de moedas do usuário
              if (this.user) {
                this.user.moedas = response.novoSaldoMoedas;
              }

              // Recarregar filtros disponíveis
              this.premiumPermissionsService.refreshPermissions().subscribe();

              this.toastService.show({
                detail: `Acesso à cidade ${this.user?.bairroId?.cidade} desbloqueado!`,
                severity: 'success',
              });
            }
          },
          error: (error) => {
            this.toastService.show({
              detail: error.error?.message || 'Erro ao comprar acesso à cidade',
              severity: 'error',
            });
          },
        });
    } catch (error) {
      this.toastService.show({
        detail: 'Erro ao comprar acesso à cidade',
        severity: 'error',
      });
    }
  }

  async comprarAcessoEstado(): Promise<void> {
    if (!this.user?.bairroId?.estado) {
      this.toastService.show({
        detail: 'Informações de estado não encontradas',
        severity: 'error',
      });
      return;
    }

    try {
      this.rankingService.comprarAcessoEstado(this.user.bairroId.estado).subscribe({
        next: (response) => {
          if (response.sucesso) {
            this.mostrarDialogPremium = false;

            // Atualizar saldo de moedas do usuário
            if (this.user) {
              this.user.moedas = response.novoSaldoMoedas;
            }

            // Recarregar filtros disponíveis
            this.premiumPermissionsService.refreshPermissions().subscribe();

            this.toastService.show({
              detail: `Acesso ao estado ${this.user?.bairroId?.estado} desbloqueado!`,
              severity: 'success',
            });
          }
        },
        error: (error) => {
          this.toastService.show({
            detail: error.error?.message || 'Erro ao comprar acesso ao estado',
            severity: 'error',
          });
        },
      });
    } catch (error) {
      this.toastService.show({
        detail: 'Erro ao comprar acesso ao estado',
        severity: 'error',
      });
    }
  }

  async comprarAcessoNacional(): Promise<void> {
    try {
      this.rankingService.comprarAcessoNacional().subscribe({
        next: (response) => {
          if (response.sucesso) {
            this.mostrarDialogPremium = false;

            // Atualizar saldo de moedas do usuário
            if (this.user) {
              this.user.moedas = response.novoSaldoMoedas;
            }

            // Recarregar filtros disponíveis
            this.premiumPermissionsService.refreshPermissions().subscribe();

            this.toastService.show({
              detail: 'Acesso nacional desbloqueado!',
              severity: 'success',
            });
          }
        },
        error: (error) => {
          this.toastService.show({
            detail: error.error?.message || 'Erro ao comprar acesso nacional',
            severity: 'error',
          });
        },
      });
    } catch (error) {
      this.toastService.show({
        detail: 'Erro ao comprar acesso nacional',
        severity: 'error',
      });
    }
  }

  async comprarAssinaturaPremium(): Promise<void> {
    try {
      this.rankingService.comprarAssinaturaPremium(1).subscribe({
        next: (response) => {
          if (response.sucesso) {
            this.mostrarDialogPremium = false;

            // Atualizar saldo de moedas do usuário
            if (this.user) {
              this.user.moedas = response.novoSaldoMoedas;
            }

            // Recarregar filtros disponíveis
            this.premiumPermissionsService.refreshPermissions().subscribe();

            this.toastService.show({
              detail: 'Assinatura Premium ativada! Você tem acesso a tudo por 1 mês.',
              severity: 'success',
            });
          }
        },
        error: (error) => {
          this.toastService.show({
            detail: error.error?.message || 'Erro ao comprar assinatura premium',
            severity: 'error',
          });
        },
      });
    } catch (error) {
      this.toastService.show({
        detail: 'Erro ao comprar assinatura premium',
        severity: 'error',
      });
    }
  }

  // Método para determinar qual tipo de compra fazer baseado no filtro selecionado
  comprarAcessoFiltroSelecionado(): void {
    switch (this.filtroSelecionado.value) {
      case 'cidade':
        this.comprarAcessoCidade();
        break;
      case 'estado':
        this.comprarAcessoEstado();
        break;
      case 'nacional':
        this.comprarAcessoNacional();
        break;
      default:
        this.toastService.show({
          detail: 'Tipo de acesso não reconhecido',
          severity: 'error',
        });
    }
  }

  private loadRankingBairrosCidade(): void {
    this.rankingService.getRankingBairrosCidade({ limit: 50 }).subscribe({
      next: (response) => {
        this.rankingBairros = response.data.map((item: any, index: number) => ({
          posicao: index + 1,
          bairro: {
            nome: item.nome,
            cidade: item.cidade,
            estado: item.estado,
          },
          pontos_totais: item.totalPoints,
          usuarios_ativos: item.usuarios_ativos || 0,
          media_pontuacao: item.media_pontuacao || 0,
        }));
      },
      error: () => {
        this.toastService.show({
          detail: 'Erro ao carregar ranking de bairros da sua cidade',
          severity: 'error',
        });
      },
    });
  }

  private loadRankingBairrosNacional(): void {
    this.rankingService.getRankingBairrosNacional({ limit: 50 }).subscribe({
      next: (response) => {
        this.rankingBairros = response.data.map((item: any, index: number) => ({
          posicao: index + 1,
          bairro: {
            nome: item.nome,
            cidade: item.cidade,
            estado: item.estado,
          },
          pontos_totais: item.totalPoints,
          usuarios_ativos: item.usuarios_ativos || 0,
          media_pontuacao: item.media_pontuacao || 0,
        }));
      },
      error: () => {
        this.toastService.show({
          detail: 'Erro ao carregar ranking nacional de bairros',
          severity: 'error',
        });
      },
    });
  }

  // Métodos auxiliares para o template
  getCustoFiltro(filtroValue?: string): number {
    if (!filtroValue) return 0;

    const custos = this.custosAcesso || this.custos;

    switch (filtroValue) {
      case 'cidade':
        return custos.cidade;
      case 'estado':
        return custos.estado;
      case 'nacional':
        return custos.nacional;
      default:
        return 0;
    }
  }

  temSaldoSuficiente(filtroValue?: string): boolean {
    if (!this.user || !filtroValue) return false;
    const custo = this.getCustoFiltro(filtroValue);
    return this.user.moedas >= custo;
  }

  temSaldoSuficientePremium(): boolean {
    if (!this.user) return false;
    const custos = this.custosAcesso || this.custos;
    return this.user.moedas >= custos.assinaturaPremiumMensal;
  }

  fecharDialogPremium(): void {
    this.mostrarDialogPremium = false;
  }
}
