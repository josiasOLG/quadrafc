import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

// PrimeNG Components
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { Jogo, JogoFilters } from '../../../shared/models/jogo.model';
import { JogoService } from '../../../shared/services/jogo.service';

@Component({
  selector: 'app-game-list',
  standalone: true,
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    ToolbarModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    TagModule,
    BadgeModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
    CheckboxModule,
    TabViewModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class GameListComponent implements OnInit {
  jogos: Jogo[] = [];
  campeonatos: any[] = [];
  loading = false;
  syncing = false;
  totalRecords = 0;
  pageSize = 10;
  first = 0;

  currentView = 'lista';
  viewOptions = [
    { label: 'Lista Simples', value: 'lista' },
    { label: 'Por Campeonatos', value: 'campeonatos' },
  ];

  filters: JogoFilters = {};

  statusOptions = [
    { label: 'Aberto', value: 'aberto' },
    { label: 'Encerrado', value: 'encerrado' },
  ];

  constructor(
    private jogoService: JogoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.onViewChange();
  }

  onViewChange() {
    if (this.currentView === 'campeonatos') {
      this.loadJogosPorCampeonatos();
    } else {
      this.loadJogos();
    }
  }

  loadJogos(event?: any) {
    this.loading = true;

    if (event) {
      this.first = event.first || 0;
      this.pageSize = event.rows || 10;

      // Handle sorting
      if (event.sortField) {
        this.filters.sortBy = event.sortField;
        this.filters.sortOrder = event.sortOrder === 1 ? 'ASC' : 'DESC';
      }
    }

    this.filters.page = Math.floor(this.first / this.pageSize) + 1;
    this.filters.limit = this.pageSize;

    this.jogoService.getJogos(this.filters).subscribe({
      next: (response) => {
        this.jogos = response.data;
        this.totalRecords = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar jogos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar jogos',
        });
        this.loading = false;
      },
    });
  }

  loadJogosPorCampeonatos() {
    this.loading = true;

    let dataInicial: string | undefined;
    let dataFinal: string | undefined;

    if (this.filters.dataInicio) {
      const startDate = new Date(this.filters.dataInicio);
      dataInicial = startDate.toISOString().split('T')[0];
    }

    if (this.filters.dataFim) {
      const endDate = new Date(this.filters.dataFim);
      dataFinal = endDate.toISOString().split('T')[0];
    }

    this.jogoService
      .getJogosPorCampeonatosAtualizado(dataInicial, dataFinal, 1, 50) // Busca mais campeonatos
      .subscribe({
        next: (response) => {
          this.campeonatos = response.campeonatos || [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar jogos por campeonatos:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao carregar jogos por campeonatos',
          });
          this.loading = false;
        },
      });
  }

  applyFilters() {
    this.first = 0;
    this.onViewChange(); // Usa o método que detecta a visualização atual
  }

  clearFilters() {
    this.filters = {};
    this.first = 0;
    this.onViewChange(); // Usa o método que detecta a visualização atual
  }

  syncGames() {
    this.syncing = true;

    this.messageService.add({
      severity: 'info',
      summary: 'Sincronização Global 60 Dias Iniciada',
      detail:
        '🌍 Buscando jogos dos próximos 60 dias (de 10 em 10 dias) e salvando por campeonato...',
      life: 4000,
    });

    // Usa o novo endpoint de sincronização global de 60 dias
    this.jogoService.sincronizarGlobal60Dias().subscribe({
      next: (resultado: any) => {
        const totalJogosSalvos = resultado?.totalJogosSalvos || 0;
        const totalCampeonatos = resultado?.totalCampeonatos || 0;
        const periodosProcessados = resultado?.periodosProcessados || 0;
        const jogosNovos = resultado?.estatisticas?.jogosNovos || 0;
        const jogosAtualizados = resultado?.estatisticas?.jogosAtualizados || 0;

        this.messageService.add({
          severity: 'success',
          summary: 'Sincronização Global 60 Dias Completa! 🎯🏆',
          detail: `✅ ${totalJogosSalvos} jogos salvos em ${totalCampeonatos} campeonatos | 📅 ${periodosProcessados}/6 períodos processados | 🆕 ${jogosNovos} novos, 🔄 ${jogosAtualizados} atualizados`,
          life: 12000,
        });

        // Mostrar detalhes dos campeonatos encontrados
        if (resultado?.jogosPorCampeonato && Object.keys(resultado.jogosPorCampeonato).length > 0) {
          const topCampeonatos = Object.entries(resultado.jogosPorCampeonato)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([nome, quantidade]) => `${nome}: ${quantidade}`)
            .join(' | ');

          this.messageService.add({
            severity: 'info',
            summary: 'Top 5 Campeonatos Sincronizados',
            detail: `🏆 ${topCampeonatos}`,
            life: 8000,
          });
        }

        this.syncing = false;
        this.onViewChange(); // Recarrega a visualização atual
      },
      error: (error: any) => {
        console.error('Erro na sincronização global 60 dias:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro na Sincronização Global 60 Dias',
          detail: `❌ Falha ao sincronizar jogos dos próximos 60 dias: ${
            error.error?.message || error.message
          }`,
          life: 8000,
        });
        this.syncing = false;
      },
    });
  }

  /**
   * Novo método para verificar jogos finalizados e processar palpites
   */
  verificarJogosFinalizados() {
    this.messageService.add({
      severity: 'info',
      summary: 'Verificação Iniciada',
      detail: '🔍 Verificando jogos finalizados e processando palpites...',
      life: 3000,
    });

    this.jogoService.verificarJogosFinalizados().subscribe({
      next: (resultado: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Verificação Completa!',
          detail: '✅ Jogos finalizados verificados e palpites processados',
          life: 5000,
        });
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro na Verificação',
          detail: 'Falha ao verificar jogos finalizados',
          life: 5000,
        });
      },
    });
  }

  /**
   * Novo método para ver status dos crons
   */
  verStatusCrons() {
    this.jogoService.obterStatusCrons().subscribe({
      next: (status: any) => {
        const cronInfo = Object.entries(status.crons || {})
          .map(([nome, horario]) => `${nome}: ${horario}`)
          .join('\n');

        this.messageService.add({
          severity: 'info',
          summary: 'Status dos Crons',
          detail: `🤖 Sistemas automáticos ativos:\n${cronInfo}`,
          life: 8000,
        });
      },
      error: (error: any) => {
        console.error('Erro ao obter status:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao obter status dos crons',
          life: 5000,
        });
      },
    });
  }

  togglePalpites(jogo: Jogo) {
    this.messageService.add({
      severity: 'info',
      summary: 'Funcionalidade não disponível',
      detail: 'Esta funcionalidade ainda não está implementada no backend',
    });
  }

  updateResult(jogo: Jogo) {
    this.messageService.add({
      severity: 'info',
      summary: 'Funcionalidade não disponível',
      detail: 'Esta funcionalidade ainda não está implementada no backend',
    });
  }

  canEdit(jogo: Jogo): boolean {
    // Só permite editar jogos criados manualmente (código API >= 999900000)
    return jogo.codigoAPI >= 999900000;
  }

  canDelete(jogo: Jogo): boolean {
    // Só permite deletar jogos criados manualmente (código API >= 999900000)
    return jogo.codigoAPI >= 999900000;
  }

  deleteJogo(jogo: Jogo) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja deletar o jogo ${jogo.timeA.nome} x ${jogo.timeB.nome}?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.jogoService.deleteJogo(jogo._id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Jogo deletado com sucesso',
            });
            this.onViewChange(); // Recarrega a visualização atual
          },
          error: (error) => {
            console.error('Erro ao deletar jogo:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: error.error?.message || 'Erro ao deletar jogo',
            });
          },
        });
      },
    });
  }

  canUpdateResult(jogo: Jogo): boolean {
    return jogo.status === 'em_andamento' || jogo.status === 'agendado';
  }

  formatDate(dateTime: string | Date): string {
    return new Date(dateTime).toLocaleDateString('pt-BR');
  }

  formatTime(dateTime: string | Date): string {
    return new Date(dateTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      aberto: 'Aberto',
      encerrado: 'Encerrado',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const severities: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
      aberto: 'info',
      encerrado: 'success',
    };
    return severities[status] || 'secondary';
  }
}
