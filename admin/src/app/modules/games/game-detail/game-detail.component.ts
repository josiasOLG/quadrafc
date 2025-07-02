import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { Jogo } from '../../../shared/models/jogo.model';
import { JogoService } from '../../../shared/services/jogo.service';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    CardModule,
    TagModule,
    BadgeModule,
    ToastModule,
    ProgressSpinnerModule,
    DividerModule,
    TabViewModule,
    ChipModule,
    SkeletonModule,
  ],
  providers: [MessageService],
  template: `
    <div class="game-detail-container">
      <p-toast></p-toast>

      <div *ngIf="loading" class="card">
        <div class="flex justify-content-between align-items-center mb-4">
          <p-skeleton height="2rem" width="200px"></p-skeleton>
          <p-skeleton height="2.5rem" width="100px"></p-skeleton>
        </div>
        <p-skeleton height="200px" class="mb-4"></p-skeleton>
        <p-skeleton height="400px"></p-skeleton>
      </div>

      <div *ngIf="!loading && jogo" class="card">
        <!-- Header -->
        <div class="flex justify-content-between align-items-center mb-4">
          <h2 class="m-0">Detalhes do Jogo</h2>
          <div class="flex gap-2">
            <p-button
              icon="pi pi-arrow-left"
              label="Voltar"
              severity="secondary"
              (click)="goBack()"
            >
            </p-button>
          </div>
        </div>

        <!-- Game Info Card -->
        <div class="grid">
          <div class="col-12 lg:col-8">
            <div class="game-info-card p-4 border-round-lg surface-ground">
              <div class="flex justify-content-center align-items-center mb-4">
                <div class="text-center">
                  <img
                    [src]="jogo.timeA.escudo || 'assets/images/team-placeholder.png'"
                    [alt]="jogo.timeA.nome"
                    class="team-logo-large mb-2"
                  />
                  <h3 class="m-0 font-bold">{{ jogo.timeA.nome }}</h3>
                  <small class="text-color-secondary">Time A</small>
                </div>

                <div class="mx-4 text-center">
                  <div
                    *ngIf="jogo.status === 'encerrado' && jogo.resultado; else noScore"
                    class="score-container"
                  >
                    <span class="text-6xl font-bold text-primary">
                      {{ jogo.resultado.timeA ?? 0 }} - {{ jogo.resultado.timeB ?? 0 }}
                    </span>
                  </div>
                  <ng-template #noScore>
                    <span class="text-4xl font-bold text-color-secondary">VS</span>
                  </ng-template>
                  <div class="mt-2">
                    <p-tag
                      [value]="getStatusLabel(jogo.status)"
                      [severity]="getStatusSeverity(jogo.status)"
                    >
                    </p-tag>
                  </div>
                </div>

                <div class="text-center">
                  <img
                    [src]="jogo.timeB.escudo || 'assets/images/team-placeholder.png'"
                    [alt]="jogo.timeB.nome"
                    class="team-logo-large mb-2"
                  />
                  <h3 class="m-0 font-bold">{{ jogo.timeB.nome }}</h3>
                  <small class="text-color-secondary">Time B</small>
                </div>
              </div>

              <p-divider></p-divider>

              <div class="grid text-center">
                <div class="col-6 md:col-3">
                  <div class="stat-item">
                    <i class="pi pi-calendar text-2xl text-primary mb-2"></i>
                    <div class="font-semibold">{{ formatDate(jogo.data) }}</div>
                    <small class="text-color-secondary">Data</small>
                  </div>
                </div>
                <div class="col-6 md:col-3">
                  <div class="stat-item">
                    <i class="pi pi-clock text-2xl text-primary mb-2"></i>
                    <div class="font-semibold">{{ formatTime(jogo.data) }}</div>
                    <small class="text-color-secondary">Horário</small>
                  </div>
                </div>
                <div class="col-6 md:col-3">
                  <div class="stat-item">
                    <i class="pi pi-trophy text-2xl text-primary mb-2"></i>
                    <div class="font-semibold">{{ jogo.campeonato }}</div>
                    <small class="text-color-secondary">Campeonato</small>
                  </div>
                </div>
                <div class="col-6 md:col-3">
                  <div class="stat-item">
                    <i class="pi pi-hashtag text-2xl text-primary mb-2"></i>
                    <div class="font-semibold">{{ jogo.rodada || '-' }}</div>
                    <small class="text-color-secondary">Rodada</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 lg:col-4">
            <div class="game-stats-card h-full">
              <h4 class="mb-3">Informações</h4>

              <div class="flex align-items-center justify-content-between mb-3">
                <span>Palpites Abertos:</span>
                <p-chip
                  [label]="jogo.status === 'aberto' ? 'Sim' : 'Não'"
                  [styleClass]="jogo.status === 'aberto' ? 'chip-success' : 'chip-danger'"
                >
                </p-chip>
              </div>

              <div class="flex align-items-center justify-content-between mb-3">
                <span>Total de Palpites:</span>
                <p-badge
                  [value]="(jogo.palpites?.length || 0).toString()"
                  severity="info"
                ></p-badge>
              </div>

              <div
                *ngIf="jogo.estadio"
                class="flex align-items-center justify-content-between mb-3"
              >
                <span>Estádio:</span>
                <span class="font-semibold">{{ jogo.estadio }}</span>
              </div>

              <div *ngIf="jogo.cidade" class="flex align-items-center justify-content-between mb-3">
                <span>Cidade:</span>
                <span class="font-semibold">{{ jogo.cidade }}</span>
              </div>

              <div *ngIf="jogo.estado" class="flex align-items-center justify-content-between mb-3">
                <span>Estado:</span>
                <span class="font-semibold">{{ jogo.estado }}</span>
              </div>

              <div class="flex align-items-center justify-content-between mb-3">
                <span>Criado em:</span>
                <span class="text-sm">{{ formatDateTime(jogo.createdAt) }}</span>
              </div>

              <div
                *ngIf="jogo.updatedAt !== jogo.createdAt"
                class="flex align-items-center justify-content-between mb-3"
              >
                <span>Atualizado em:</span>
                <span class="text-sm">{{ formatDateTime(jogo.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <p-tabView class="mt-4">
          <p-tabPanel header="Observações" leftIcon="pi pi-file-text">
            <div class="tab-content">
              <div
                *ngIf="jogo.observacoes; else noObservations"
                class="p-3 surface-ground border-round"
              >
                <p class="m-0 line-height-3">{{ jogo.observacoes }}</p>
              </div>
              <ng-template #noObservations>
                <div class="text-center py-4">
                  <i class="pi pi-info-circle text-3xl text-color-secondary mb-3"></i>
                  <p class="m-0 text-color-secondary">
                    Nenhuma observação adicionada para este jogo.
                  </p>
                </div>
              </ng-template>
            </div>
          </p-tabPanel>

          <p-tabPanel header="Palpites" leftIcon="pi pi-star">
            <div class="tab-content">
              <div class="text-center py-4">
                <i class="pi pi-star text-3xl text-color-secondary mb-3"></i>
                <p class="m-0 text-color-secondary">
                  Lista de palpites será implementada em breve.
                </p>
              </div>
            </div>
          </p-tabPanel>

          <p-tabPanel header="Estatísticas" leftIcon="pi pi-chart-bar">
            <div class="tab-content">
              <div class="text-center py-4">
                <i class="pi pi-chart-bar text-3xl text-color-secondary mb-3"></i>
                <p class="m-0 text-color-secondary">
                  Estatísticas detalhadas serão implementadas em breve.
                </p>
              </div>
            </div>
          </p-tabPanel>
        </p-tabView>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && !jogo" class="card text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
        <h3>Jogo não encontrado</h3>
        <p class="text-color-secondary mb-4">
          O jogo solicitado não foi encontrado ou foi removido.
        </p>
        <p-button label="Voltar para Lista" icon="pi pi-arrow-left" (click)="goBack()"> </p-button>
      </div>
    </div>
  `,
  styles: [
    `
      .game-detail-container {
        padding: 1rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .game-info-card {
        background: var(--surface-ground);
        border: 1px solid var(--surface-border);
      }

      .game-stats-card {
        background: var(--surface-section);
        padding: 1.5rem;
        border-radius: 6px;
        border: 1px solid var(--surface-border);
      }

      .team-logo-large {
        width: 80px;
        height: 80px;
        object-fit: contain;
        border-radius: 8px;
        border: 2px solid var(--surface-border);
      }

      .score-container {
        margin: 1rem 0;
      }

      .stat-item {
        padding: 1rem;
        text-align: center;
      }

      .stat-item i {
        display: block;
        margin-bottom: 0.5rem;
      }

      .chip-success {
        background-color: var(--green-100);
        color: var(--green-900);
      }

      .chip-danger {
        background-color: var(--red-100);
        color: var(--red-900);
      }

      .tab-content {
        min-height: 200px;
      }

      @media (max-width: 768px) {
        .game-detail-container {
          padding: 0.5rem;
        }

        .team-logo-large {
          width: 60px;
          height: 60px;
        }

        .score-container .text-6xl {
          font-size: 3rem !important;
        }

        .stat-item {
          padding: 0.5rem;
        }
      }
    `,
  ],
})
export class GameDetailComponent implements OnInit {
  jogo: Jogo | null = null;
  loading = false;
  gameId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private jogoService: JogoService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.gameId = params['id'];
        this.loadGame();
      }
    });
  }

  private loadGame() {
    if (!this.gameId) return;

    this.loading = true;
    this.jogoService.getJogoById(this.gameId).subscribe({
      next: (jogo) => {
        this.jogo = jogo;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar jogo:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados do jogo',
        });
        this.loading = false;
      },
    });
  }

  formatDate(dateTime: string | Date): string {
    return new Date(dateTime).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatTime(dateTime: string | Date): string {
    return new Date(dateTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDateTime(dateTime?: Date): string {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleString('pt-BR');
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

  goBack() {
    this.router.navigate(['/games']);
  }
}
