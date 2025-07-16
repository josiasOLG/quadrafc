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

import { UserMiniHeaderComponent } from '../../../../shared/components/user-mini-header/user-mini-header.component';
import { Palpite } from '../../../../shared/schemas/palpite.schema';
import { User } from '../../../../shared/schemas/user.schema';
import { GlobalDialogService } from '../../../../shared/services/global-dialog.service';
import { PalpitesService } from '../../../../shared/services/palpites.service';
import { AuthService } from '../../../auth/services/auth.service';
import { JOGO_STATUS_CORES, JOGO_STATUS_LABELS, JogoStatus } from '../../enums/jogo-status.enum';
import { JogosService } from '../../services/jogos.service';
import { PalpiteDialogComponent } from './palpite-dialog/palpite-dialog.component';
import { WelcomeDialogComponent } from './welcome-dialog/welcome-dialog.component';
import { WelcomeService } from './welcome-dialog/welcome.service';

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
    timeB?: number;
    timeA?: number;
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
  campeonatoStartDate?: string;
  campeonatoEndDate?: string;
  isActive?: boolean;
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
    UserMiniHeaderComponent,
    WelcomeDialogComponent,
    PalpiteDialogComponent,
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
  showWelcomeDialog = false;
  palpiteForm: FormGroup;
  isSubmittingPalpite = false;

  constructor(
    private fb: FormBuilder,
    private jogosService: JogosService,
    private palpitesService: PalpitesService,
    private authService: AuthService,
    private globalDialogService: GlobalDialogService,
    private welcomeService: WelcomeService
  ) {
    this.palpiteForm = this.fb.group({
      golsTimeA: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      golsTimeB: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
    });
  }

  ngOnInit(): void {
    this.loadUser();
    this.loadJogos();
    this.checkWelcomeDialog();
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

    // Primeiro tenta buscar via endpoint de campeonatos (limite de 50 jogos)
    this.jogosService.getJogosPorCampeonatos(hoje, 900).subscribe({
      next: (response: any) => {
        if (response && response.campeonatos) {
          this.campeonatos = response.campeonatos.map((campeonato: any) => ({
            nome: campeonato.nome,
            jogos: campeonato.jogos || [],
            total: campeonato.total || campeonato.jogos?.length || 0,
            campeonatoStartDate: campeonato.campeonatoStartDate,
            campeonatoEndDate: campeonato.campeonatoEndDate,
            isActive: this.isCampeonatoActive(
              campeonato.campeonatoStartDate,
              campeonato.campeonatoEndDate
            ),
          }));

          this.jogos = [];
        } else {
          this.campeonatos = [];
        }
        this.isLoading = false;
      },
      error: () => {
        // Fallback para o método original
        this.jogosService.getJogosByData(new Date()).subscribe({
          next: (response: any) => {
            this.jogos = response || [];

            // Organiza manualmente em campeonatos
            this.organizarJogosEmCampeonatos(this.jogos);
            this.isLoading = false;
          },
          error: () => {
            this.globalDialogService.showError(
              'Erro ao Carregar',
              'Não foi possível carregar os jogos do dia'
            );
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

  openPalpiteDialog(jogo: JogoComPalpite, campeonato?: CampeonatoOrganizado): void {
    if (!this.canMakePalpite(jogo, campeonato)) {
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

      const props = {
        title: 'Palpite enviado',
        message: 'Seu palpite foi enviado com sucesso!',
        details: 'Obrigado por participar!',
        duration: 0,
        btnTitleClose: 'Continuar',
      };

      this.globalDialogService.showSuccess(props);

      this.closePalpiteDialog();
      this.loadJogos();
    } catch {
      // this.globalDialogService.showError(
      //   'Erro',
      //   'Não foi possível enviar o palpite. Tente novamente.'
      // );
    } finally {
      this.isSubmittingPalpite = false;
    }
  }

  canMakePalpite(jogo: JogoComPalpite, campeonato?: CampeonatoOrganizado): boolean {
    // Usa a mesma lógica do botão para consistência
    return this.shouldShowPalpiteButton(jogo, campeonato);
  }

  // Verifica se o jogo já iniciou baseado na data/hora
  jogoJaIniciou(jogo: JogoComPalpite): boolean {
    const agora = new Date();
    const inicioJogo = new Date(jogo.data);
    return agora >= inicioJogo;
  }

  // Verifica se o botão palpitar deve ser exibido
  shouldShowPalpiteButton(jogo: JogoComPalpite, campeonato?: CampeonatoOrganizado): boolean {
    // Se já tem palpite, não mostra o botão
    if (jogo.palpites && jogo.palpites.length > 0) {
      return false;
    }

    // Se o campeonato não está ativo, não mostra o botão
    if (campeonato && !campeonato.isActive) {
      return false;
    }

    // Se o jogo já iniciou (baseado na data/hora), não mostra o botão
    if (this.jogoJaIniciou(jogo)) {
      return false;
    }

    // Se o status não permite palpite, não mostra o botão
    // Apenas permite palpites para jogos abertos ou agendados
    // if (jogo.status !== JogoStatus.ABERTO && jogo.status !== JogoStatus.AGENDADO) {
    //   return false;
    // }

    console.log('shouldShowPalpiteButton:', jogo, campeonato);

    return true;
  }

  getJogoStatus(jogo: JogoComPalpite): {
    label: string;
    severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';
  } {
    const status = jogo.status as JogoStatus;

    // Usar o label do enum ou fallback para o valor original
    const label = JOGO_STATUS_LABELS[status] || jogo.status;

    // Mapear a cor do enum para severity do PrimeNG
    const cor = JOGO_STATUS_CORES[status];
    let severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';

    switch (cor) {
      case 'success':
        severity = 'success';
        break;
      case 'info':
        severity = 'info';
        break;
      case 'warning':
        severity = 'warning';
        break;
      case 'danger':
        severity = 'danger';
        break;
      case 'primary':
        severity = 'info';
        break;
      case 'secondary':
      default:
        severity = 'secondary';
        break;
    }

    return { label, severity };
  }

  getPalpiteStatus(jogo: JogoComPalpite): {
    label: string;
    severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';
    icon?: string;
    showPoints?: boolean;
    points?: number;
    exactScore?: boolean;
  } | null {
    if (!jogo.palpites || jogo.palpites.length === 0) {
      return null;
    }

    const palpite = jogo.palpites[0] as any;

    // Se o jogo ainda não terminou
    if (jogo.status !== JogoStatus.ENCERRADO) {
      return {
        label: 'Palpite enviado',
        severity: 'info',
        icon: 'pi pi-clock',
      };
    }

    // Se o jogo terminou mas não tem resultado
    if (!jogo.resultado) {
      return {
        label: 'Aguardando resultado',
        severity: 'warning',
        icon: 'pi pi-hourglass',
      };
    }

    const resultado = jogo.resultado;
    const palpiteValue = palpite.palpite;

    // Normaliza os valores do resultado (trata undefined como 0)
    const resultadoTimeA = resultado.timeA ?? 0;
    const resultadoTimeB = resultado.timeB ?? 0;

    // Normaliza os valores do palpite (trata undefined como 0)
    const palpiteTimeA = palpiteValue.timeA ?? 0;
    const palpiteTimeB = palpiteValue.timeB ?? 0;

    // Verifica se acertou o placar exato (números iguais)
    const acertouPlacar = palpiteTimeA === resultadoTimeA && palpiteTimeB === resultadoTimeB;

    if (acertouPlacar) {
      return {
        label: 'Acertou o placar exato!',
        severity: 'success',
        icon: 'pi pi-trophy',
        showPoints: true,
        points: palpite.pontos || 0,
        exactScore: true,
      };
    }

    // Se não acertou o placar exato, sempre mostra como erro
    // (mesmo que tenha acertado o vencedor)
    return {
      label: '',
      severity: 'danger',
      icon: '',
      showPoints: true,
      points: palpite.pontos || 0,
      exactScore: false,
    };
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

  // Welcome Dialog Methods
  checkWelcomeDialog(): void {
    if (!this.welcomeService.hasSeenWelcomeDialog()) {
      // Aguarda um pouco para garantir que a tela carregou
      setTimeout(() => {
        this.showWelcomeDialog = true;
      }, 1000);
    }
  }

  onWelcomeDialogClose(): void {
    this.showWelcomeDialog = false;
    this.welcomeService.markWelcomeDialogAsSeen();
  }

  isCampeonatoActive(startDate?: string, endDate?: string): boolean {
    if (!startDate && !endDate) {
      return true;
    }

    const now = new Date();
    const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (startDate) {
      const dataInicio = new Date(startDate);
      const inicioSemHora = new Date(
        dataInicio.getFullYear(),
        dataInicio.getMonth(),
        dataInicio.getDate()
      );

      if (hoje < inicioSemHora) {
        return false;
      }
    }

    if (endDate) {
      const dataFim = new Date(endDate);
      const fimSemHora = new Date(dataFim.getFullYear(), dataFim.getMonth(), dataFim.getDate());

      if (hoje > fimSemHora) {
        return false;
      }
    }

    return true;
  }

  getCampeonatoStatusMessage(campeonato: CampeonatoOrganizado): string {
    if (campeonato.isActive) {
      return '';
    }

    const now = new Date();
    const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (campeonato.campeonatoStartDate) {
      const dataInicio = new Date(campeonato.campeonatoStartDate);
      const inicioSemHora = new Date(
        dataInicio.getFullYear(),
        dataInicio.getMonth(),
        dataInicio.getDate()
      );

      if (hoje < inicioSemHora) {
        const diasRestantes = Math.ceil(
          (inicioSemHora.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diasRestantes === 1) {
          return 'Campeonato inicia amanhã';
        } else if (diasRestantes <= 7) {
          return `Campeonato inicia em ${diasRestantes} dias`;
        } else {
          return `Campeonato inicia em ${inicioSemHora.toLocaleDateString('pt-BR')}`;
        }
      }
    }

    if (campeonato.campeonatoEndDate) {
      const dataFim = new Date(campeonato.campeonatoEndDate);
      const fimSemHora = new Date(dataFim.getFullYear(), dataFim.getMonth(), dataFim.getDate());

      if (hoje > fimSemHora) {
        return 'Campeonato já encerrado';
      }
    }

    return 'Campeonato não está ativo';
  }
}
