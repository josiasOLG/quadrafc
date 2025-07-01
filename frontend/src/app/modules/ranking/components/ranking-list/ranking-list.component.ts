import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../../../../core/services/auth.service';
import { PremiumPermissionsService } from '../../../../core/services/premium-permissions.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { User } from '../../../../shared/schemas/user.schema';
import { ToastService } from '../../../../shared/services/toast.service';
import { RankingService } from '../../services/ranking.service';

// Interfaces temporariamente não utilizadas (serão usadas na versão premium)
/*
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
*/

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

@Component({
  selector: 'app-ranking-list',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TabViewModule,
    BadgeModule,
    AvatarModule,
    ButtonModule,
    SkeletonModule,
    TagModule,
    DialogModule,
    TooltipModule,
    PageHeaderComponent,
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

  // Filtros (temporariamente removidos - será implementado na versão premium)
  // filtroSelecionado: FiltroRanking = {
  //   label: 'Meu Bairro',
  //   value: 'bairro',
  //   disponivel: true,
  //   gratuito: true,
  // };
  // filtros: FiltroRanking[] = [
  //   { label: 'Meu Bairro', value: 'bairro', disponivel: true, gratuito: true },
  // ];

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

  // Cookie key para usuário
  private readonly USER_COOKIE_KEY = 'quadrafc_user';

  constructor(
    private rankingService: RankingService,
    private authService: AuthService,
    private toastService: ToastService,
    private premiumPermissionsService: PremiumPermissionsService
  ) {}

  /**
   * Carrega informações do usuário a partir do cookie
   * Usado como fallback para garantir que os dados estejam disponíveis
   */
  private loadUserFromCookie(): void {
    try {
      const userCookie = this.getCookie(this.USER_COOKIE_KEY);
      if (userCookie) {
        const userData = JSON.parse(decodeURIComponent(userCookie));
        console.log('📄 Dados do usuário carregados do cookie:', userData);

        // Popula this.user com os dados do cookie
        this.user = userData;

        // Se ainda não temos rankings carregados, carrega agora
        if (!this.rankingUsuarios || this.rankingUsuarios.length === 0) {
          console.log('🔄 Carregando rankings com dados do cookie...');
          this.loadRankings();
        }
      } else {
        console.warn('⚠️ Cookie de usuário não encontrado');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do cookie:', error);
    }
  }

  /**
   * Método utilitário para ler cookies
   */
  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  ngOnInit(): void {
    console.log('🎯 Inicializando ranking-list component...');

    // Carregar dados do usuário primeiro
    this.loadUserFromCookie();
    this.loadUser();

    // Aguardar um pouco para garantir que o usuário foi carregado
    setTimeout(() => {
      this.loadFiltrosDisponiveis();
      this.loadRankings();
    }, 100);
  }

  private loadFiltrosDisponiveis(): void {
    // Sistema de filtros temporariamente desabilitado
    // Será implementado na versão premium
    /*
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
    */
  }

  private loadUser(): void {
    this.authService.currentUser$.subscribe((user) => {
      const wasUserNull = !this.user;
      this.user = user;

      // Se o usuário acabou de ser carregado e os rankings ainda não foram carregados
      if (wasUserNull && user && this.rankingUsuarios.length === 0) {
        console.log('👤 Usuário carregado via observable, recarregando rankings...');
        this.loadRankings();
      }
    });
  }

  private loadRankings(): void {
    this.isLoading = true;

    console.log('🏙️ Carregando rankings da cidade do usuário logado...');

    // Verificar se o usuário está carregado
    if (!this.user) {
      console.warn('⚠️ Usuário não carregado ainda, aguardando...');
      // Aguardar um pouco e tentar novamente
      setTimeout(() => {
        if (this.user) {
          this.loadRankings();
        } else {
          console.error('❌ Usuário não foi carregado após timeout');
          this.isLoading = false;
          this.toastService.show({
            detail: 'Erro ao carregar dados do usuário',
            severity: 'error',
          });
        }
      }, 1000);
      return;
    }

    // Carregar rankings da cidade do usuário logado (backend filtra automaticamente)
    Promise.all([this.loadRankingUsuarios(), this.loadRankingBairros()]).finally(() => {
      this.isLoading = false;

      // Verificar sincronização após carregamento
      setTimeout(() => {
        this.verificarSincronizacaoUsuario();
      }, 500);
    });
  }

  private async loadRankingUsuarios(): Promise<void> {
    try {
      if (!this.user) {
        console.warn('⚠️ Usuário não carregado ainda, não é possível carregar ranking');
        return;
      }

      // Obter cidade e estado do usuário
      const cidade = this.user.cidade;
      const estado = this.user.estado;

      if (!cidade || !estado) {
        console.warn('⚠️ Usuário não possui cidade/estado definidos:', {
          cidade,
          estado,
          user: this.user,
        });
        this.toastService.show({
          detail: 'Complete seu perfil para ver o ranking da sua cidade',
          severity: 'warn',
        });
        return;
      }

      const params = {
        limit: 50,
        offset: 0,
      };

      console.log('📡 Enviando params para ranking usuários da cidade:', {
        cidade,
        estado,
        params,
      });

      this.rankingService.getRankingUsuariosCidade(cidade, estado, params).subscribe({
        next: (response) => {
          console.log('✅ Dados recebidos do ranking de usuários da cidade:', response);

          if (response.data && Array.isArray(response.data)) {
            this.rankingUsuarios = response.data.map((item: any) => {
              const mappedUser = {
                posicao: item.posicao || 0,
                usuario: {
                  _id: item._id,
                  nome: item.nome || 'Usuário',
                  avatar: item.avatarUrl || item.avatar || '',
                  bairro: item.bairro || '',
                  cidade: item.cidade || '',
                  estado: item.estado || '',
                },
                pontos: item.pontos || item.totalPoints || 0,
                palpites_corretos: item.palpites_corretos || 0,
                total_palpites: item.total_palpites || 0,
                taxa_acerto: item.taxa_acerto || 0,
                sequencia_atual: item.sequencia_atual || 0,
                isCurrentUser: this.user?._id === item._id || false,
              };

              console.log('👤 Usuário mapeado:', mappedUser);
              return mappedUser;
            });

            console.log(
              `🏆 Ranking de usuários carregado: ${this.rankingUsuarios.length} usuários`
            );
          } else {
            console.warn('⚠️ Resposta não contém array de dados:', response);
            this.rankingUsuarios = [];
          }
        },
        error: (error) => {
          console.error('❌ Erro ao carregar ranking de usuários:', error);
          this.toastService.show({
            detail: 'Erro ao carregar ranking de usuários',
            severity: 'error',
          });
        },
      });
    } catch (_error) {
      console.error('❌ Erro no método loadRankingUsuarios:', _error);
      this.toastService.show({
        detail: 'Erro ao carregar ranking de usuários',
        severity: 'error',
      });
    }
  }

  private async loadRankingBairros(): Promise<void> {
    try {
      if (!this.user) {
        console.warn('⚠️ Usuário não carregado ainda, não é possível carregar ranking');
        return;
      }

      // Obter cidade e estado do usuário
      const cidade = this.user.cidade;
      const estado = this.user.estado;

      if (!cidade || !estado) {
        console.warn('⚠️ Usuário não possui cidade/estado definidos:', {
          cidade,
          estado,
          user: this.user,
        });
        this.toastService.show({
          detail: 'Complete seu perfil para ver o ranking da sua cidade',
          severity: 'warn',
        });
        return;
      }

      const params = {
        limit: 20,
        offset: 0,
      };

      console.log('📡 Enviando params para ranking bairros da cidade:', {
        cidade,
        estado,
        params,
      });

      this.rankingService.getRankingBairrosCidade(cidade, estado, params).subscribe({
        next: (response) => {
          console.log('✅ Dados recebidos do ranking de bairros da cidade:', response);

          if (response.data && Array.isArray(response.data)) {
            this.rankingBairros = response.data.map((item: any) => {
              const mappedBairro = {
                posicao: item.posicao || 0,
                bairro: {
                  nome: item.nome || 'Bairro',
                  cidade: item.cidade || '',
                  estado: item.estado || '',
                },
                pontos_totais: item.pontos_totais || 0,
                usuarios_ativos: item.usuarios_ativos || 0,
                media_pontuacao: item.media_pontuacao || 0,
              };

              console.log('🏘️ Bairro mapeado:', mappedBairro);
              return mappedBairro;
            });

            console.log(`🏆 Ranking de bairros carregado: ${this.rankingBairros.length} bairros`);
          } else {
            console.warn('⚠️ Resposta não contém array de dados:', response);
            this.rankingBairros = [];
          }
        },
        error: (error) => {
          console.error('❌ Erro ao carregar ranking de bairros:', error);
          this.toastService.show({
            detail: 'Erro ao carregar ranking de bairros',
            severity: 'error',
          });
        },
      });
    } catch (_error) {
      console.error('❌ Erro no método loadRankingBairros:', _error);
      this.toastService.show({
        detail: 'Erro ao carregar ranking de bairros',
        severity: 'error',
      });
    }
  }

  onFiltroChange(): void {
    // Sistema de filtros temporariamente desabilitado
    // Será implementado na versão premium
    /*
    // Verificar se o filtro selecionado está disponível
    if (!this.filtroSelecionado.disponivel) {
      // Se não está disponível, mostrar dialog de compra
      this.mostrarDialogPremium = true;
      this.premiumAccess.custoDesbloqueio = this.filtroSelecionado.custo || 100;
      return;
    }

    // Se está disponível, carregar os dados baseado no filtro
    this.loadRankingsByFilter();
    */
  }

  private loadRankingsByFilter(): void {
    // Sistema de filtros temporariamente desabilitado
    // Apenas carrega ranking da cidade do usuário
    this.loadRankings();
    /*
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
    */
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
    if (!this.user) {
      return null;
    }

    const currentUser = this.rankingUsuarios.find((item) => {
      // Verificar por ID do usuário
      const userMatch = item.usuario._id === this.user?._id;

      if (userMatch) {
        console.log('Usuário atual encontrado no ranking:', {
          usuario: item.usuario,
          posicao: item.posicao,
          pontos: item.pontos,
          bairro: item.usuario.bairro,
        });
      }

      return userMatch;
    });

    return currentUser?.posicao || null;
  }

  // Método para verificar se o usuário está no bairro correto no ranking
  getCurrentUserBairroInfo(): { bairro: string; cidade: string; estado: string } | null {
    if (!this.user) {
      return null;
    }

    const currentUser = this.rankingUsuarios.find((item) => item.usuario._id === this.user?._id);

    if (currentUser) {
      return {
        bairro: currentUser.usuario.bairro,
        cidade: currentUser.usuario.cidade,
        estado: currentUser.usuario.estado,
      };
    }

    return null;
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

  getStarsArray(): number[] {
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
    } catch {
      this.premiumAccess.verificando = false;
    }
  }

  onFiltroChangeWithPremium(): void {
    // Sistema de filtros temporariamente desabilitado
    // Apenas carrega ranking da cidade do usuário
    this.loadRankings();
    /*
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
    */
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
    } catch {
      this.toastService.show({
        detail: 'Erro ao desbloquear ranking nacional',
        severity: 'error',
      });
    }
  }

  // Métodos para comprar acesso específico
  async comprarAcessoCidade(): Promise<void> {
    const cidade = this.user?.cidade;
    const estado = this.user?.estado;

    if (!cidade || !estado) {
      this.toastService.show({
        detail: 'Informações de localização não encontradas',
        severity: 'error',
      });
      return;
    }

    try {
      this.rankingService.comprarAcessoCidade(cidade, estado).subscribe({
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
              detail: `Acesso à cidade ${cidade} desbloqueado!`,
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
    } catch {
      this.toastService.show({
        detail: 'Erro ao comprar acesso à cidade',
        severity: 'error',
      });
    }
  }

  async comprarAcessoEstado(): Promise<void> {
    if (!this.user?.estado) {
      this.toastService.show({
        detail: 'Informações de estado não encontradas',
        severity: 'error',
      });
      return;
    }

    try {
      this.rankingService.comprarAcessoEstado(this.user.estado).subscribe({
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
              detail: `Acesso ao estado ${this.user?.estado} desbloqueado!`,
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
    } catch {
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
    } catch {
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
    } catch {
      this.toastService.show({
        detail: 'Erro ao comprar assinatura premium',
        severity: 'error',
      });
    }
  }

  // Método para determinar qual tipo de compra fazer baseado no filtro selecionado
  comprarAcessoFiltroSelecionado(): void {
    // Sistema de filtros temporariamente desabilitado
    // Por enquanto não faz nada
    /*
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
    */
  }

  private loadRankingBairrosCidade(): void {
    if (!this.user) {
      console.warn('⚠️ Usuário não carregado ainda, não é possível carregar ranking');
      return;
    }

    // Obter cidade e estado do usuário
    const cidade = this.user.cidade;
    const estado = this.user.estado;

    if (!cidade || !estado) {
      console.warn('⚠️ Usuário não possui cidade/estado definidos');
      return;
    }

    this.rankingService.getRankingBairrosCidade(cidade, estado, { limit: 50 }).subscribe({
      next: (response) => {
        console.log('Dados brutos do ranking de bairros da cidade:', response.data);

        this.rankingBairros = response.data.map((item: any, index: number) => {
          const mappedBairro = {
            posicao: index + 1,
            bairro: {
              nome: item.nome || item.bairro || 'Bairro',
              cidade: item.cidade || '',
              estado: item.estado || '',
            },
            pontos_totais: item.totalPoints || item.pontos_totais || 0,
            usuarios_ativos: item.usuarios_ativos || item.usuariosAtivos || 0,
            media_pontuacao: item.media_pontuacao || item.mediaPontuacao || 0,
          };

          console.log('Bairro da cidade mapeado:', mappedBairro);
          return mappedBairro;
        });

        console.log('Ranking de bairros da cidade final:', this.rankingBairros);
      },
      error: (error) => {
        console.error('Erro ao carregar ranking de bairros da cidade:', error);
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
        console.log('Dados brutos do ranking nacional de bairros:', response.data);

        this.rankingBairros = response.data.map((item: any, index: number) => {
          const mappedBairro = {
            posicao: index + 1,
            bairro: {
              nome: item.nome || item.bairro || 'Bairro',
              cidade: item.cidade || '',
              estado: item.estado || '',
            },
            pontos_totais: item.totalPoints || item.pontos_totais || 0,
            usuarios_ativos: item.usuarios_ativos || item.usuariosAtivos || 0,
            media_pontuacao: item.media_pontuacao || item.mediaPontuacao || 0,
          };

          console.log('Bairro nacional mapeado:', mappedBairro);
          return mappedBairro;
        });

        console.log('Ranking nacional de bairros final:', this.rankingBairros);
      },
      error: (error) => {
        console.error('Erro ao carregar ranking nacional de bairros:', error);
        this.toastService.show({
          detail: 'Erro ao carregar ranking nacional de bairros',
          severity: 'error',
        });
      },
    });
  }

  // Métodos auxiliares para o template (temporariamente desabilitados)
  getCustoFiltro(): number {
    // Sistema de filtros temporariamente desabilitado
    return 0;
  }

  temSaldoSuficiente(): boolean {
    // Sistema de filtros temporariamente desabilitado
    return true;
  }

  temSaldoSuficientePremium(): boolean {
    if (!this.user) return false;
    const custos = this.custosAcesso || this.custos;
    return this.user.moedas >= custos.assinaturaPremiumMensal;
  }

  fecharDialogPremium(): void {
    this.mostrarDialogPremium = false;
  }

  // Método para verificar se dados do usuário estão sincronizados
  verificarSincronizacaoUsuario(): void {
    if (!this.user) {
      return;
    }

    const userRanking = this.rankingUsuarios.find((item) => item.usuario._id === this.user?._id);

    if (userRanking) {
      const profileBairro = this.user.bairro || '';
      const rankingBairro = userRanking.usuario.bairro || '';

      console.log('🔍 Verificação de sincronização de dados do usuário:', {
        usuario_id: this.user._id,
        perfil: {
          nome: this.user.nome,
          bairro: profileBairro,
          cidade: this.user.cidade,
          estado: this.user.estado,
          totalPoints: this.user.totalPoints,
        },
        ranking: {
          nome: userRanking.usuario.nome,
          bairro: rankingBairro,
          cidade: userRanking.usuario.cidade,
          estado: userRanking.usuario.estado,
          pontos: userRanking.pontos,
          posicao: userRanking.posicao,
        },
        sincronizado: {
          bairro: profileBairro === rankingBairro,
          pontos: this.user.totalPoints === userRanking.pontos,
        },
      });

      // Se houver divergência significativa, avisar
      if (profileBairro !== rankingBairro) {
        console.warn('⚠️ ATENÇÃO: Bairro do perfil não coincide com bairro no ranking!', {
          perfil: profileBairro,
          ranking: rankingBairro,
        });
      }

      if (Math.abs((this.user.totalPoints || 0) - userRanking.pontos) > 10) {
        console.warn('⚠️ ATENÇÃO: Pontos do perfil não coincidem com pontos no ranking!', {
          perfil: this.user.totalPoints,
          ranking: userRanking.pontos,
          diferenca: Math.abs((this.user.totalPoints || 0) - userRanking.pontos),
        });
      }
    } else {
      console.warn('⚠️ ATENÇÃO: Usuário não encontrado no ranking!', {
        usuario_id: this.user._id,
        nome: this.user.nome,
      });
    }
  }

  // Métodos utilitários para formatação
  formatarPontos(pontos: number): string {
    if (pontos >= 1000000) {
      return (pontos / 1000000).toFixed(1) + 'M';
    }
    if (pontos >= 1000) {
      return (pontos / 1000).toFixed(1) + 'K';
    }
    return pontos.toString();
  }

  formatarTaxaAcerto(taxa: number): string {
    return taxa.toFixed(1);
  }
}
