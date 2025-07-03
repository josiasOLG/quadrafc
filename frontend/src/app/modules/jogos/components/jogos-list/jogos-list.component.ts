import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';

import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { AppButtonComponent } from '../../../../shared/components/app-button/app-button.component';
import { AppModalComponent } from '../../../../shared/components/app-modal/app-modal.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

import { AuthService } from '../../../../core/services/auth.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { Palpite } from '../../../../shared/schemas/palpite.schema';
import { User } from '../../../../shared/schemas/user.schema';
import { PalpitesService } from '../../../../shared/services/palpites.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { JogosService } from '../../services/jogos.service';

// Interface para jogos que vêm da API
interface JogoAPI {
  _id?: string;
  codigoAPI?: number;
  timeA: {
    nome: string;
    escudo?: string;
  };
  timeB: {
    nome: string;
    escudo?: string;
  };
  data: string;
  resultado?: {
    gols_casa?: number;
    gols_visitante?: number;
  } | null;
  status: 'aberto' | 'encerrado' | 'ao_vivo' | 'agendado' | 'finalizado';
  campeonato: string;
  rodadaId?: {
    _id: string;
    nome: string;
    descricao: string;
    dataInicio: string;
    dataFim: string;
    ativa: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  estadio?: string;
  cidade?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface JogoComPalpite extends JogoAPI {
  palpites?: Palpite[];
}

// Interface para campeonatos organizados (retornados da API)
interface CampeonatoOrganizado {
  nome: string;
  jogos: JogoComPalpite[];
  total: number;
}

@Component({
  selector: 'app-jogos-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    BadgeModule,
    TagModule,
    SkeletonModule,
    TooltipModule,
    InputTextModule,
    TabViewModule,
    AppModalComponent,
    AppButtonComponent,
    PageHeaderComponent,
    CurrencyFormatPipe,
  ],
  templateUrl: './jogos-list.component.html',
  styleUrls: ['./jogos-list.component.scss'],
})
export class JogosListComponent implements OnInit {
  jogos: JogoComPalpite[] = [];
  campeonatos: CampeonatoOrganizado[] = [];
  activeTabIndex = 0;
  user: User | null = null;
  isLoading = true;
  selectedJogo: JogoComPalpite | null = null;
  showPalpiteDialog = false;
  palpiteForm: FormGroup;
  isSubmittingPalpite = false;

  constructor(
    private fb: FormBuilder,
    private jogosService: JogosService,
    private palpitesService: PalpitesService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.palpiteForm = this.fb.group({
      golsTimeA: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      golsTimeB: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
    });
  }

  ngOnInit(): void {
    this.loadUser();
    this.loadJogos();
  }

  private loadUser(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
  }

  private loadJogos(): void {
    this.isLoading = true;

    // Busca jogos organizados por campeonatos
    const hoje = new Date().toISOString().split('T')[0];

    // Primeiro tenta buscar via endpoint de campeonatos
    this.jogosService.getJogosPorCampeonatos(hoje, 60).subscribe({
      next: (response: any) => {
        // A resposta já vem diretamente com os dados (sem wrapper success/data)
        if (response && response.campeonatos) {
          this.campeonatos = response.campeonatos.map((campeonato: any) => ({
            nome: campeonato.nome,
            jogos: campeonato.jogos || [],
            total: campeonato.total || campeonato.jogos?.length || 0,
          }));

          // Limpa a lista de jogos já que agora estamos usando campeonatos
          this.jogos = [];
        } else {
          this.campeonatos = [];
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        // Fallback para o método original
        this.jogosService.getJogosByData(new Date()).subscribe({
          next: (response: any) => {
            this.jogos = response || [];

            // Organiza manualmente em campeonatos
            this.organizarJogosEmCampeonatos(this.jogos);
            this.isLoading = false;
          },
          error: (fallbackError: any) => {
            this.toastService.show({ detail: 'Erro ao carregar jogos do dia', severity: 'error' });
            this.campeonatos = [];
            this.isLoading = false;
          },
        });
      },
    });
  }

  private organizarJogosEmCampeonatos(jogos: JogoComPalpite[]): void {
    const campeonatosMap = new Map<string, CampeonatoOrganizado>();

    jogos.forEach((jogo) => {
      const nomeCampeonato = jogo.campeonato || 'Outros';

      if (!campeonatosMap.has(nomeCampeonato)) {
        campeonatosMap.set(nomeCampeonato, {
          nome: nomeCampeonato,
          jogos: [],
          total: 0,
        });
      }

      const campeonato = campeonatosMap.get(nomeCampeonato)!;
      campeonato.jogos.push(jogo);
      campeonato.total++;
    });

    this.campeonatos = Array.from(campeonatosMap.values());
  }

  openPalpiteDialog(jogo: JogoComPalpite): void {
    if (!this.canMakePalpite(jogo)) {
      return;
    }

    this.selectedJogo = jogo;
    this.palpiteForm.reset();
    this.showPalpiteDialog = true;
  }

  closePalpiteDialog(): void {
    this.selectedJogo = null;
    this.showPalpiteDialog = false;
    this.palpiteForm.reset();
  }

  async submitPalpite(): Promise<void> {
    if (!this.selectedJogo || !this.palpiteForm.valid) {
      return;
    }

    this.isSubmittingPalpite = true;

    try {
      const formData = this.palpiteForm.value;
      // Enviar no formato esperado pelo backend: { jogoId, timeA, timeB }
      await this.palpitesService
        .create({
          jogoId: this.selectedJogo._id || '',
          timeA: parseInt(formData.golsTimeA, 10),
          timeB: parseInt(formData.golsTimeB, 10),
        })
        .toPromise();

      this.toastService.show({
        detail: 'Palpite enviado com sucesso!',
        severity: 'success',
      });

      this.closePalpiteDialog();
      this.loadJogos(); // Recarregar para atualizar status dos palpites
    } catch (error) {
      this.toastService.show({
        detail: 'Erro ao enviar palpite',
        severity: 'error',
      });
    } finally {
      this.isSubmittingPalpite = false;
    }
  }

  canMakePalpite(jogo: JogoComPalpite): boolean {
    const agora = new Date();
    const inicioJogo = new Date(jogo.data);
    return (
      agora < inicioJogo &&
      (jogo.status === 'agendado' || jogo.status === 'aberto') &&
      jogo.palpites?.length === 0
    );
  }

  getJogoStatus(jogo: JogoComPalpite): {
    label: string;
    severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';
  } {
    switch (jogo.status) {
      case 'agendado':
      case 'aberto':
        return { label: 'Agendado', severity: 'info' };
      case 'ao_vivo':
        return { label: 'Ao Vivo', severity: 'danger' };
      case 'finalizado':
      case 'encerrado':
        return { label: 'Finalizado', severity: 'success' };
      default:
        return { label: 'Desconhecido', severity: 'secondary' };
    }
  }

  getPalpiteStatus(jogo: JogoComPalpite): {
    label: string;
    severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';
  } | null {
    if (!jogo.palpites) {
      return null;
    }

    if ((jogo.status === 'finalizado' || jogo.status === 'encerrado') && jogo.resultado) {
      const palpite = jogo.palpites.at(0) as Palpite;
      const resultado = jogo.resultado;

      const palpiteValue = palpite.palpite as any;
      const acertouPlacar =
        palpiteValue.gols_casa === (resultado.gols_casa || 0) &&
        palpiteValue.gols_visitante === (resultado.gols_visitante || 0);

      if (acertouPlacar) {
        return { label: 'Acertou o placar!', severity: 'success' };
      }

      const acertouVencedor =
        this.getVencedor(palpiteValue.gols_casa, palpiteValue.gols_visitante) ===
        this.getVencedor(resultado.gols_casa || 0, resultado.gols_visitante || 0);

      if (acertouVencedor) {
        return { label: 'Acertou o vencedor', severity: 'info' };
      }

      return { label: 'Errou', severity: 'danger' };
    }

    return { label: 'Palpite enviado', severity: 'success' };
  }

  private getVencedor(golsA: number, golsB: number): 'A' | 'B' | 'empate' {
    if (golsA > golsB) return 'A';
    if (golsB > golsA) return 'B';
    return 'empate';
  }

  formatDataHora(dataHora: string): string {
    const data = new Date(dataHora);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Track by functions para performance
  trackByCampeonato(index: number, campeonato: CampeonatoOrganizado): string {
    return campeonato.nome;
  }

  trackByJogo(index: number, jogo: JogoComPalpite): string {
    return jogo._id || `${jogo.timeA.nome}-${jogo.timeB.nome}-${jogo.data}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      // Esconde a imagem quando falha ao carregar
      img.style.display = 'none';
    }
  }
}
