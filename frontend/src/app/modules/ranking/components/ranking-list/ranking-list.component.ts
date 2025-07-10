import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { UserMiniHeaderComponent } from '../../../../shared/components/user-mini-header/user-mini-header.component';
import { User } from '../../../../shared/schemas/user.schema';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RankingService } from '../../services/ranking.service';
import { UserRankingComponent } from '../user-ranking/user-ranking.component';

interface RankingBairro {
  posicao: number;
  bairro: {
    id?: string;
    nome: string;
    cidade: string;
    estado: string;
    cep?: string;
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
    BadgeModule,
    ButtonModule,
    SkeletonModule,
    TagModule,
    TooltipModule,
    UserMiniHeaderComponent,
    UserRankingComponent,
  ],
  templateUrl: './ranking-list.component.html',
  styleUrls: ['./ranking-list.component.scss'],
})
export class RankingListComponent implements OnInit {
  user: User | null = null;
  rankingBairros: RankingBairro[] = [];
  isLoading = true;

  // Tab system
  activeTab: 'bairros' | 'usuarios' = 'bairros';
  selectedBairroForUserRanking: RankingBairro | null = null;

  // Cookie key para usuário
  private readonly USER_COOKIE_KEY = 'quadrafc_user';

  constructor(
    private rankingService: RankingService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  /**
   * Carrega informações do usuário a partir do cookie
   */
  private loadUserFromCookie(): void {
    try {
      const userCookie = this.getCookie(this.USER_COOKIE_KEY);
      if (userCookie) {
        const userData = JSON.parse(decodeURIComponent(userCookie));
        console.log('📄 Dados do usuário carregados do cookie:', userData);
        this.user = userData;

        if (!this.rankingBairros || this.rankingBairros.length === 0) {
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
    this.loadUserFromCookie();
    this.loadUser();

    setTimeout(() => {
      this.loadRankings();
    }, 100);
  }

  /**
   * Carrega dados do usuário logado
   */
  private loadUser(): void {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      const wasUserNull = this.user === null;
      this.user = currentUser;
      console.log('👤 Usuário carregado:', currentUser);

      if (wasUserNull && currentUser && this.rankingBairros.length === 0) {
        console.log('🔄 Carregando rankings após obter dados do usuário...');
        this.loadRankings();
      }
    } else {
      console.warn('⚠️ Usuário não logado');
    }
  }

  /**
   * Método principal para carregar os rankings
   */
  private loadRankings(): void {
    console.log('🎯 Iniciando carregamento dos rankings...');

    if (!this.user?.cidade || !this.user?.estado) {
      console.warn('⚠️ Dados de localização do usuário não disponíveis');
      this.toastService.warn('Configure sua localização para ver o ranking');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.loadRankingBairros();
  }

  /**
   * Carrega ranking de bairros
   */
  private loadRankingBairros(): void {
    if (!this.user?.cidade || !this.user?.estado) {
      console.error('❌ Cidade ou estado não definidos para carregar ranking de bairros');
      this.isLoading = false;
      return;
    }

    console.log(
      `🏘️ Carregando ranking de bairros para ${this.user.cidade} - ${this.user.estado}...`
    );

    this.rankingService.getRankingBairrosCidade(this.user.cidade, this.user.estado).subscribe({
      next: (response: any) => {
        try {
          console.log('🏘️ Resposta do ranking de bairros:', response);

          if (response?.data) {
            this.rankingBairros = response.data.map((item: any, index: number) => ({
              posicao: index + 1,
              bairro: {
                nome: item.bairro || item.nome || item._id,
                cidade: item.cidade || this.user?.cidade || '',
                estado: item.estado || this.user?.estado || '',
              },
              pontos_totais: item.pontos_totais || item.totalPoints || item.pontos || 0,
              usuarios_ativos: item.usuarios_ativos || item.totalUsuarios || item.usuarios || 0,
              media_pontuacao: item.media_pontuacao || item.pontuacaoMedia || item.mediaPoints || 0,
            }));

            console.log(`🏆 Ranking de bairros carregado: ${this.rankingBairros.length} bairros`);
          } else {
            console.warn('⚠️ Resposta inválida do ranking de bairros:', response);
            this.rankingBairros = [];
          }
        } catch (error) {
          console.error('❌ Erro ao processar dados de bairros:', error);
          this.rankingBairros = [];
          this.toastService.error('Erro ao processar dados do ranking de bairros');
        } finally {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('❌ Erro ao carregar ranking de bairros:', error);
        this.isLoading = false;
        this.rankingBairros = [];
        this.toastService.error('Erro ao carregar ranking de bairros');
      },
    });
  }

  /**
   * Track by function para otimizar renderização de bairros
   */
  trackByBairro(index: number, item: RankingBairro): string {
    return `${item.bairro.nome}-${item.bairro.cidade}-${item.posicao}`;
  }

  /**
   * Abre o ranking de usuários de um bairro
   */
  openUserRankingForBairro(bairro: RankingBairro): void {
    this.selectedBairroForUserRanking = bairro;
    this.activeTab = 'usuarios';
  }

  /**
   * Define a tab ativa
   */
  setActiveTab(tab: 'bairros' | 'usuarios'): void {
    this.activeTab = tab;

    // Se a tab de usuários for selecionada e não há bairro selecionado,
    // seleciona automaticamente o primeiro bairro do ranking
    if (
      tab === 'usuarios' &&
      !this.selectedBairroForUserRanking &&
      this.rankingBairros.length > 0
    ) {
      this.selectedBairroForUserRanking = this.rankingBairros[0];
    }
  }

  /**
   * Retorna classe CSS para badge de ranking
   */
  getRankingBadgeClass(posicao: number): string {
    if (posicao === 1) return 'ranking-badge--first';
    if (posicao === 2) return 'ranking-badge--second';
    if (posicao === 3) return 'ranking-badge--third';
    if (posicao <= 10) return 'ranking-badge--top10';
    return 'ranking-badge--default';
  }

  /**
   * Retorna ícone e cor da medalha baseado na posição
   */
  getBairroMedalha(posicao: number): { icon: string; color: string } | null {
    switch (posicao) {
      case 1:
        return { icon: 'pi-crown', color: '#FFD700' };
      case 2:
        return { icon: 'pi-star', color: '#C0C0C0' };
      case 3:
        return { icon: 'pi-trophy', color: '#CD7F32' };
      default:
        return null;
    }
  }

  /**
   * Formata número com separadores de milhares
   */
  formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) {
      return '0';
    }
    return new Intl.NumberFormat('pt-BR').format(num);
  }

  /**
   * Formata percentual com 1 casa decimal
   */
  formatPercentage(num: number): string {
    return `${num.toFixed(1)}%`;
  }
}
