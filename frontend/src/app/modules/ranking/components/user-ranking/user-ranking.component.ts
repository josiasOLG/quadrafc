import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { User } from '../../../../shared/schemas/user.schema';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RankingService } from '../../services/ranking.service';

interface RankingUsuario {
  posicao: number;
  user: {
    id?: string;
    nome: string;
    avatar?: string;
    email: string;
  };
  pontos_totais: number;
  palpites_corretos: number;
  palpites_totais: number;
  percentual_acerto: number;
}

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

// Interface para representar os dados retornados pelo endpoint de top usuários por bairro
interface BairroComUsuarios {
  bairro: string;
  cidade: string;
  estado: string;
  pontos_totais: number;
  total_usuarios: number;
  usuarios: any[]; // Lista de usuários do bairro
}

@Component({
  selector: 'app-user-ranking',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    BadgeModule,
    ButtonModule,
    SkeletonModule,
    TagModule,
    DialogModule,
    TooltipModule,
  ],
  templateUrl: './user-ranking.component.html',
  styleUrls: ['./user-ranking.component.scss'],
})
export class UserRankingComponent implements OnInit {
  @Input() selectedBairro: RankingBairro | null = null;

  user: User | null = null;
  rankingUsuarios: RankingUsuario[] = [];
  isLoading = false;
  showUserDetailsModal = false;
  selectedUserDetails: RankingUsuario | null = null;

  // Propriedades para armazenar a resposta do endpoint de top usuários por bairro
  topUsuariosPorBairro: any[] = [];
  bairroSelecionado: string | null = null;

  constructor(
    private authService: AuthService,
    private rankingService: RankingService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    console.log('🔄 Inicializando componente user-ranking');
    // Primeiro, carregar o usuário atual
    this.loadCurrentUser();

    // Se já temos um bairro selecionado, carregar ranking imediatamente
    if (this.selectedBairro) {
      console.log('🏠 Bairro já selecionado:', this.selectedBairro.bairro.nome);
      this.loadUserRanking();
    } else {
      console.log('⏳ Aguardando dados do usuário para carregar ranking...');
    }
  }

  private loadCurrentUser() {
    this.authService.currentUser$.subscribe({
      next: (user: User | null) => {
        this.user = user;
        // Após carregar o usuário, verificamos se devemos iniciar o carregamento do ranking
        if (user && (!this.selectedBairro || !this.rankingUsuarios.length)) {
          console.log('👤 Usuário carregado, carregando ranking com dados do usuário:', {
            cidade: user.cidade,
            estado: user.estado,
            bairro: user.bairro,
          });
          // Carregar ranking com os dados do usuário logado
          this.loadUserRankingFromUserData();
        }
      },
      error: (error: any) => {
        console.error('Erro ao carregar usuário:', error);
      },
    });
  }

  // Novo método para carregar o ranking a partir dos dados do usuário logado
  private loadUserRankingFromUserData() {
    if (!this.user || !this.user.cidade || !this.user.estado) {
      console.warn('⚠️ Dados do usuário incompletos para carregar ranking');
      return;
    }

    this.isLoading = true;
    this.bairroSelecionado = this.user.bairro || null;

    // Usando o endpoint com os dados do usuário logado
    this.rankingService.getTopUsuariosPorBairro(this.user.cidade, this.user.estado).subscribe({
      next: (response) => {
        this.processRankingResponse(response);
      },
      error: (error) => {
        this.handleRankingError(error);
      },
    });
  }

  loadUserRanking() {
    if (!this.selectedBairro) {
      // Se não há bairro selecionado e temos um usuário, usar dados do usuário
      if (this.user) {
        this.loadUserRankingFromUserData();
      }
      return;
    }

    this.isLoading = true;
    this.bairroSelecionado = this.selectedBairro.bairro.nome;

    // Usando o novo endpoint para obter os top 5 usuários por bairro
    this.rankingService
      .getTopUsuariosPorBairro(this.selectedBairro.bairro.cidade, this.selectedBairro.bairro.estado)
      .subscribe({
        next: (response) => {
          this.processRankingResponse(response);
        },
        error: (error) => {
          this.handleRankingError(error);
        },
      });
  }

  // Método auxiliar para processar a resposta do ranking
  private processRankingResponse(response: any) {
    console.log('🏆 Resposta de top usuários por bairro:', response);

    if (response?.data && Array.isArray(response.data)) {
      // Armazenar a resposta completa
      this.topUsuariosPorBairro = response.data;

      // Definir qual bairro mostrar
      let bairroParaMostrar = this.bairroSelecionado;

      // Se não temos um bairro selecionado mas temos o usuário, usar o bairro do usuário
      if (!bairroParaMostrar && this.user?.bairro) {
        bairroParaMostrar = this.user.bairro;
      }

      // Encontrar o bairro específico
      const bairroData = response.data.find(
        (item: BairroComUsuarios) => item.bairro === bairroParaMostrar
      );

      if (bairroData && bairroData.usuarios) {
        // Converter os dados para o formato do componente
        this.rankingUsuarios = bairroData.usuarios.map((usuario: any, index: number) => ({
          posicao: index + 1,
          user: {
            id: usuario._id,
            nome: usuario.nome,
            email: usuario.email || '',
            avatar: usuario.avatarUrl || usuario.avatar || '',
          },
          pontos_totais: usuario.totalPoints || usuario.pontos || 0,
          palpites_corretos: usuario.palpites_corretos || 0,
          palpites_totais: usuario.total_palpites || 0,
          percentual_acerto: usuario.taxa_acerto || 0,
        }));

        console.log(
          `👥 ${this.rankingUsuarios.length} usuários carregados para o bairro ${bairroParaMostrar}`
        );
      } else {
        // Se não encontrou o bairro específico e temos dados, mostrar o primeiro bairro
        if (response.data.length > 0 && response.data[0].usuarios) {
          const primeiroBairro = response.data[0] as BairroComUsuarios;
          this.bairroSelecionado = primeiroBairro.bairro;

          this.rankingUsuarios = primeiroBairro.usuarios.map((usuario: any, index: number) => ({
            posicao: index + 1,
            user: {
              id: usuario._id,
              nome: usuario.nome,
              email: usuario.email || '',
              avatar: usuario.avatarUrl || usuario.avatar || '',
            },
            pontos_totais: usuario.totalPoints || usuario.pontos || 0,
            palpites_corretos: usuario.palpites_corretos || 0,
            palpites_totais: usuario.total_palpites || 0,
            percentual_acerto: usuario.taxa_acerto || 0,
          }));

          console.log(`🔄 Usando primeiro bairro disponível: ${this.bairroSelecionado}`);
        } else {
          console.warn(`⚠️ Nenhum dado de usuário encontrado para bairros`);
          this.rankingUsuarios = [];
        }
      }
    } else {
      console.error('❌ Formato de resposta inválido:', response);
      this.rankingUsuarios = [];
      this.toastService.error('Erro ao processar dados do ranking');
    }

    this.isLoading = false;
  }

  // Método auxiliar para lidar com erros
  private handleRankingError(error: any) {
    console.error('❌ Erro ao carregar ranking de usuários:', error);
    this.rankingUsuarios = [];
    this.isLoading = false;
    this.toastService.error('Erro ao carregar ranking de usuários');
  }

  private generateMockUserRanking(): RankingUsuario[] {
    return [
      {
        posicao: 1,
        user: {
          id: '1',
          nome: 'João Silva',
          email: 'joao@email.com',
          avatar: '',
        },
        pontos_totais: 1250,
        palpites_corretos: 45,
        palpites_totais: 60,
        percentual_acerto: 75.0,
      },
      {
        posicao: 2,
        user: {
          id: '2',
          nome: 'Maria Santos',
          email: 'maria@email.com',
          avatar: '',
        },
        pontos_totais: 1180,
        palpites_corretos: 42,
        palpites_totais: 58,
        percentual_acerto: 72.4,
      },
      {
        posicao: 3,
        user: {
          id: '3',
          nome: 'Pedro Costa',
          email: 'pedro@email.com',
          avatar: '',
        },
        pontos_totais: 1050,
        palpites_corretos: 38,
        palpites_totais: 55,
        percentual_acerto: 69.1,
      },
      {
        posicao: 4,
        user: {
          id: '4',
          nome: 'Ana Lima',
          email: 'ana@email.com',
          avatar: '',
        },
        pontos_totais: 980,
        palpites_corretos: 35,
        palpites_totais: 52,
        percentual_acerto: 67.3,
      },
      {
        posicao: 5,
        user: {
          id: '5',
          nome: 'Carlos Oliveira',
          email: 'carlos@email.com',
          avatar: '',
        },
        pontos_totais: 920,
        palpites_corretos: 32,
        palpites_totais: 50,
        percentual_acerto: 64.0,
      },
    ];
  }

  openUserDetailsModal(user: RankingUsuario) {
    this.selectedUserDetails = user;
    this.showUserDetailsModal = true;
  }

  closeUserDetailsModal() {
    this.showUserDetailsModal = false;
    this.selectedUserDetails = null;
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  trackByUser(index: number, item: RankingUsuario): any {
    return item.user.id || index;
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getUserAvatar(user: RankingUsuario): string {
    return user.user.avatar || '';
  }
}
