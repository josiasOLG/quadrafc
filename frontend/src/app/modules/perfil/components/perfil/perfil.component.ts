import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { SkeletonModule } from 'primeng/skeleton';

import { AuthService } from '../../../../core/services/auth.service';
import { PalpitesService } from '../../../../shared/services/palpites.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { User } from '../../../../shared/schemas/user.schema';
import { Palpite } from '../../../../shared/schemas/palpite.schema';

interface UserStats {
  total_palpites: number;
  palpites_corretos: number;
  taxa_acerto: number;
  pontos_totais: number;
  moedas_ganhas: number;
  sequencia_atual: number;
  melhor_sequencia: number;
  nivel: number;
  posicao_ranking: number;
}

interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  data_conquista: Date;
  raridade: 'comum' | 'raro' | 'epico' | 'lendario';
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    AvatarModule,
    BadgeModule,
    TagModule,
    TabViewModule,
    ProgressBarModule,
    DialogModule,
    InputTextModule,
    FileUploadModule,
    SkeletonModule,
    CurrencyFormatPipe,
    TimeAgoPipe
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  user: User | null = null;
  userStats: UserStats | null = null;
  recentPalpites: Palpite[] = [];
  conquistas: Conquista[] = [];
  isLoading = true;
  showEditDialog = false;
  editForm: FormGroup;
  isUpdating = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private palpitesService: PalpitesService,
    private toastService: ToastService
  ) {
    this.editForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadUserStats();
    this.loadRecentPalpites();
    this.loadConquistas();
  }

  private loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.editForm.patchValue({
          nome: user.nome,
          email: user.email
        });
      }
    });
  }

  private async loadUserStats(): Promise<void> {
    try {
      this.palpitesService.getMinhasEstatisticas().subscribe({
        next: (stats) => {
          this.userStats = {
            ...stats,
            nivel: this.user?.nivel || 1,
            posicao_ranking: 0 // TODO: buscar do ranking service
          };
        },
        error: (error) => {
          console.error('Erro ao carregar estatísticas:', error);
          this.toastService.show({
            detail: 'Erro ao carregar estatísticas',
            severity: 'error'
          });
        }
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }

  private async loadRecentPalpites(): Promise<void> {
    try {
      this.palpitesService.getMeusPalpites({ limit: 10 }).subscribe({
        next: (response) => {
          this.recentPalpites = response.data;
        },
        error: (error) => {
          console.error('Erro ao carregar palpites recentes:', error);
          this.toastService.show({
            detail: 'Erro ao carregar palpites recentes',
            severity: 'error'
          });
        }
      });
    } catch (error) {
      console.error('Erro ao carregar palpites:', error);
    }
  }

  private async loadConquistas(): Promise<void> {
    try {
      // TODO: Implementar service de conquistas
      this.conquistas = [
        {
          id: '1',
          nome: 'Primeiro Palpite',
          descricao: 'Fez seu primeiro palpite',
          icone: 'pi-star',
          data_conquista: new Date(),
          raridade: 'comum'
        },
        {
          id: '2',
          nome: 'Sequência de 5',
          descricao: 'Acertou 5 palpites seguidos',
          icone: 'pi-bolt',
          data_conquista: new Date(),
          raridade: 'raro'
        }
      ];
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  openEditDialog(): void {
    this.showEditDialog = true;
  }

  closeEditDialog(): void {
    this.showEditDialog = false;
    this.editForm.reset();
    if (this.user) {
      this.editForm.patchValue({
        nome: this.user.nome,
        email: this.user.email
      });
    }
  }

  async updateProfile(): Promise<void> {
    if (!this.editForm.valid) {
      return;
    }

    this.isUpdating = true;
    try {
      const formData = this.editForm.value;
      await this.authService.updateProfile({
        nome: formData.nome,
        email: formData.email
      });

      this.toastService.show({
        detail: 'Perfil atualizado com sucesso!',
        severity: 'success'
      });

      this.closeEditDialog();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      this.toastService.show({
        detail: 'Erro ao atualizar perfil',
        severity: 'error'
      });
    } finally {
      this.isUpdating = false;
    }
  }

  getAvatarLabel(): string {
    return this.user?.nome?.charAt(0)?.toUpperCase() || 'U';
  }

  getNivelProgress(): number {
    if (!this.userStats) return 0;

    const pontosAtual = this.userStats.pontos_totais;
    const pontosNivelAtual = (this.userStats.nivel - 1) * 1000;
    const pontosProximoNivel = this.userStats.nivel * 1000;

    const progress = ((pontosAtual - pontosNivelAtual) / (pontosProximoNivel - pontosNivelAtual)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  getPontosParaProximoNivel(): number {
    if (!this.userStats) return 0;

    const pontosAtual = this.userStats.pontos_totais;
    const pontosProximoNivel = this.userStats.nivel * 1000;

    return Math.max(pontosProximoNivel - pontosAtual, 0);
  }

  getConquistaSeverity(raridade: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    switch (raridade) {
      case 'comum': return 'secondary';
      case 'raro': return 'info';
      case 'epico': return 'warning';
      case 'lendario': return 'danger';
      default: return 'secondary';
    }
  }

  getPalpiteStatus(palpite: Palpite): { label: string; severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' } {
    switch (palpite.status) {
      case 'ganhou':
        return { label: 'Acertou', severity: 'success' };
      case 'perdeu':
        return { label: 'Errou', severity: 'danger' };
      case 'empate':
        return { label: 'Empate', severity: 'warning' };
      case 'pendente':
        return { label: 'Pendente', severity: 'info' };
      case 'cancelado':
        return { label: 'Cancelado', severity: 'secondary' };
      default:
        return { label: 'Desconhecido', severity: 'secondary' };
    }
  }

  trackByPalpite(index: number, palpite: Palpite): string {
    return palpite._id || index.toString();
  }

  trackByConquista(index: number, conquista: Conquista): string {
    return conquista.id;
  }
}
