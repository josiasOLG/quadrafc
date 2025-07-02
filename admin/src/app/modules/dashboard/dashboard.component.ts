import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import {
  AtividadeRecente,
  DashboardService,
  DashboardStats,
  JogoDestaque,
} from '../../shared/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TableModule, TagModule, SkeletonModule],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  // Estado de carregamento
  loading = true;

  // Estatísticas gerais
  stats: DashboardStats = {
    totalUsuarios: 0,
    totalJogos: 0,
    totalPalpites: 0,
    totalBairros: 0,
    usuariosAtivos: 0,
    jogosHoje: 0,
    palpitesHoje: 0,
    novosUsuariosHoje: 0,
  };

  // Dados para gráficos
  chartData: any = null;
  chartOptions: any = {};

  // Atividades recentes - inicializar como array vazio
  atividadesRecentes: AtividadeRecente[] = [];

  // Jogos em destaque - inicializar como array vazio
  jogosDestaque: JogoDestaque[] = [];

  constructor(private dashboardService: DashboardService, private messageService: MessageService) {}

  ngOnInit() {
    this.loadDashboardData();
    this.initCharts();
  }

  loadDashboardData() {
    this.loading = true;

    // Carregar estatísticas
    this.dashboardService.getAdminStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        console.log('Estatísticas carregadas:', stats);
      },
      error: (error) => {
        console.error('Erro ao carregar estatísticas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar estatísticas do dashboard',
        });
        // Dados mockados como fallback
        this.stats = {
          totalUsuarios: 1250,
          totalJogos: 45,
          totalPalpites: 8900,
          totalBairros: 120,
          usuariosAtivos: 850,
          jogosHoje: 3,
          palpitesHoje: 156,
          novosUsuariosHoje: 12,
        };
      },
    });

    // Carregar atividades recentes
    this.dashboardService.getAtividadesRecentes().subscribe({
      next: (atividades) => {
        // Garantir que é um array
        this.atividadesRecentes = Array.isArray(atividades) ? atividades : [];
        console.log('Atividades carregadas:', this.atividadesRecentes);
      },
      error: (error) => {
        console.error('Erro ao carregar atividades:', error);
        // Dados mockados como fallback
        this.atividadesRecentes = [
          {
            tipo: 'user',
            titulo: 'Novo usuário',
            descricao: 'João Silva se cadastrou no sistema',
            timestamp: new Date(),
          },
          {
            tipo: 'game',
            titulo: 'Jogo adicionado',
            descricao: 'Flamengo vs Vasco - Campeonato Carioca',
            timestamp: new Date(Date.now() - 3600000),
          },
          {
            tipo: 'bet',
            titulo: 'Palpites registrados',
            descricao: '25 novos palpites para jogos de hoje',
            timestamp: new Date(Date.now() - 7200000),
          },
        ];
      },
    });

    // Carregar jogos em destaque
    this.dashboardService.getJogosDestaque().subscribe({
      next: (jogos) => {
        // Garantir que é um array
        this.jogosDestaque = Array.isArray(jogos) ? jogos : [];
        console.log('Jogos carregados:', this.jogosDestaque);
      },
      error: (error) => {
        console.error('Erro ao carregar jogos:', error);
        // Dados mockados como fallback
        this.jogosDestaque = [
          {
            _id: '1',
            timeCasa: 'Flamengo',
            timeVisitante: 'Vasco',
            dataJogo: new Date(),
            status: 'agendado',
            totalPalpites: 45,
            campeonato: 'Campeonato Carioca',
          },
          {
            _id: '2',
            timeCasa: 'Palmeiras',
            timeVisitante: 'Corinthians',
            dataJogo: new Date(Date.now() + 86400000),
            status: 'agendado',
            totalPalpites: 38,
            campeonato: 'Campeonato Paulista',
          },
        ];
      },
    });

    this.loading = false;
  }

  initCharts() {
    // Carregar dados do gráfico de usuários
    this.dashboardService.getChartData('usuarios').subscribe({
      next: (data) => {
        this.chartData = data;
        console.log('Dados do gráfico carregados:', data);
      },
      error: (error) => {
        console.error('Erro ao carregar dados do gráfico:', error);
        // Dados mockados como fallback
        this.chartData = {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Usuários Ativos',
              data: [65, 59, 80, 81, 56, 89],
              fill: false,
              borderColor: '#42A5F5',
              tension: 0.4,
            },
            {
              label: 'Palpites',
              data: [28, 48, 40, 19, 86, 127],
              fill: false,
              borderColor: '#FFA726',
              tension: 0.4,
            },
          ],
        };
      },
    });

    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#495057',
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#495057',
          },
          grid: {
            color: '#ebedef',
          },
        },
        y: {
          ticks: {
            color: '#495057',
          },
          grid: {
            color: '#ebedef',
          },
        },
      },
    };
  }

  getSeverityClass(
    severity: string
  ): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    switch (severity) {
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      default:
        return 'info';
    }
  }

  getActivityIcon(tipo: string): string {
    switch (tipo) {
      case 'user':
        return 'pi pi-user-plus';
      case 'game':
        return 'pi pi-calendar-plus';
      case 'bet':
        return 'pi pi-star';
      case 'admin':
        return 'pi pi-cog';
      default:
        return 'pi pi-info-circle';
    }
  }

  getActivitySeverity(
    tipo: string
  ): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    switch (tipo) {
      case 'user':
        return 'success';
      case 'game':
        return 'info';
      case 'bet':
        return 'warning';
      case 'admin':
        return 'secondary';
      default:
        return 'info';
    }
  }

  getStatusSeverity(
    status: string
  ): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    switch (status) {
      case 'finalizado':
        return 'success';
      case 'em_andamento':
        return 'warning';
      case 'agendado':
        return 'info';
      case 'cancelado':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
