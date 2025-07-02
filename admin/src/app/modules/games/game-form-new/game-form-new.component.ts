import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';

import { Jogo, JogoCreate, JogoUpdate } from '../../../shared/models/jogo.model';
import { JogoService } from '../../../shared/services/jogo.service';

@Component({
  selector: 'app-game-form-new',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    InputNumberModule,
    ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  template: `
    <div class="game-form-container">
      <p-toast></p-toast>

      <div class="card">
        <div class="card-header mb-4">
          <h2 class="m-0">{{ isEditMode ? 'Editar Jogo' : 'Novo Jogo' }}</h2>
          <p class="text-color-secondary mt-2">
            {{
              isEditMode
                ? 'Atualize as informações do jogo'
                : 'Preencha os dados para criar um novo jogo'
            }}
          </p>
        </div>

        <form [formGroup]="gameForm" (ngSubmit)="onSubmit()" class="p-fluid">
          <!-- Times -->
          <div class="formgrid grid">
            <div class="field col-12 md:col-6">
              <label for="timeANome" class="font-semibold">
                Time A <span class="text-red-500">*</span>
              </label>
              <p-inputText
                id="timeANome"
                formControlName="timeANome"
                placeholder="Nome do time A"
                [class.ng-invalid]="isFieldInvalid('timeANome')"
              >
              </p-inputText>
              <small *ngIf="isFieldInvalid('timeANome')" class="p-error">
                Nome do time A é obrigatório
              </small>
            </div>

            <div class="field col-12 md:col-6">
              <label for="timeAEscudo" class="font-semibold">Escudo Time A</label>
              <p-inputText
                id="timeAEscudo"
                formControlName="timeAEscudo"
                placeholder="URL do escudo do time A"
              >
              </p-inputText>
            </div>
          </div>

          <div class="formgrid grid">
            <div class="field col-12 md:col-6">
              <label for="timeBNome" class="font-semibold">
                Time B <span class="text-red-500">*</span>
              </label>
              <p-inputText
                id="timeBNome"
                formControlName="timeBNome"
                placeholder="Nome do time B"
                [class.ng-invalid]="isFieldInvalid('timeBNome')"
              >
              </p-inputText>
              <small *ngIf="isFieldInvalid('timeBNome')" class="p-error">
                Nome do time B é obrigatório
              </small>
            </div>

            <div class="field col-12 md:col-6">
              <label for="timeBEscudo" class="font-semibold">Escudo Time B</label>
              <p-inputText
                id="timeBEscudo"
                formControlName="timeBEscudo"
                placeholder="URL do escudo do time B"
              >
              </p-inputText>
            </div>
          </div>

          <!-- Data e Campeonato -->
          <div class="formgrid grid">
            <div class="field col-12 md:col-6">
              <label for="data" class="font-semibold">
                Data e Hora <span class="text-red-500">*</span>
              </label>
              <p-calendar
                id="data"
                formControlName="data"
                [showTime]="true"
                [showIcon]="true"
                dateFormat="dd/mm/yy"
                placeholder="dd/mm/aaaa hh:mm"
                [class.ng-invalid]="isFieldInvalid('data')"
              >
              </p-calendar>
              <small *ngIf="isFieldInvalid('data')" class="p-error">
                Data e hora são obrigatórias
              </small>
            </div>

            <div class="field col-12 md:col-6">
              <label for="campeonato" class="font-semibold">
                Campeonato <span class="text-red-500">*</span>
              </label>
              <p-dropdown
                id="campeonato"
                formControlName="campeonato"
                [options]="campeonatoOptions"
                placeholder="Selecione o campeonato"
                [class.ng-invalid]="isFieldInvalid('campeonato')"
              >
              </p-dropdown>
              <small *ngIf="isFieldInvalid('campeonato')" class="p-error">
                Campeonato é obrigatório
              </small>
            </div>
          </div>

          <!-- Status -->
          <div class="formgrid grid">
            <div class="field col-12 md:col-6">
              <label for="status" class="font-semibold">Status</label>
              <p-dropdown
                id="status"
                formControlName="status"
                [options]="statusOptions"
                placeholder="Status do jogo"
              >
              </p-dropdown>
            </div>
          </div>

          <!-- Resultado (apenas se encerrado) -->
          <div *ngIf="gameForm.get('status')?.value === 'encerrado'" class="formgrid grid">
            <div class="field col-12">
              <label class="font-semibold">Resultado</label>
            </div>
            <div class="field col-12 md:col-6">
              <label for="resultadoTimeA" class="font-semibold">Gols Time A</label>
              <p-inputNumber
                id="resultadoTimeA"
                formControlName="resultadoTimeA"
                [min]="0"
                [max]="20"
                placeholder="0"
              >
              </p-inputNumber>
            </div>

            <div class="field col-12 md:col-6">
              <label for="resultadoTimeB" class="font-semibold">Gols Time B</label>
              <p-inputNumber
                id="resultadoTimeB"
                formControlName="resultadoTimeB"
                [min]="0"
                [max]="20"
                placeholder="0"
              >
              </p-inputNumber>
            </div>
          </div>

          <!-- Botões -->
          <div class="flex gap-2 justify-content-end">
            <p-button
              label="Cancelar"
              severity="secondary"
              icon="pi pi-times"
              (click)="goBack()"
              type="button"
            >
            </p-button>
            <p-button
              [label]="isEditMode ? 'Atualizar' : 'Criar'"
              icon="pi pi-check"
              type="submit"
              [loading]="submitting"
              [disabled]="gameForm.invalid"
            >
            </p-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .game-form-container {
        padding: 1rem;
      }

      .card-header {
        border-bottom: 1px solid var(--surface-border);
        padding-bottom: 1rem;
      }

      .p-card .p-card-body {
        padding: 1.5rem;
      }

      @media (max-width: 768px) {
        .game-form-container {
          padding: 0.5rem;
        }

        .formgrid.grid .field {
          margin-bottom: 1rem;
        }
      }
    `,
  ],
})
export class GameFormNewComponent implements OnInit {
  gameForm!: FormGroup;
  isEditMode = false;
  gameId: string | null = null;
  loading = false;
  submitting = false;

  campeonatoOptions = [
    { label: 'Brasileirão Serie A', value: 'Brasileirão Serie A' },
    { label: 'Copa do Brasil', value: 'Copa do Brasil' },
    { label: 'Campeonato Carioca', value: 'Campeonato Carioca' },
    { label: 'Copa Libertadores', value: 'Copa Libertadores' },
    { label: 'Copa Sul-Americana', value: 'Copa Sul-Americana' },
    { label: 'Liga dos Campeões', value: 'Liga dos Campeões' },
    { label: 'Premier League', value: 'Premier League' },
    { label: 'La Liga', value: 'La Liga' },
    { label: 'Serie A (Itália)', value: 'Serie A (Itália)' },
    { label: 'Bundesliga', value: 'Bundesliga' },
    { label: 'Ligue 1', value: 'Ligue 1' },
    { label: 'Outro', value: 'Outro' },
  ];

  statusOptions = [
    { label: 'Aberto', value: 'aberto' },
    { label: 'Encerrado', value: 'encerrado' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private jogoService: JogoService,
    private messageService: MessageService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.gameId = params['id'];
        this.loadGame();
      }
    });
  }

  private initForm() {
    this.gameForm = this.fb.group({
      timeANome: ['', [Validators.required, Validators.minLength(2)]],
      timeAEscudo: [''],
      timeBNome: ['', [Validators.required, Validators.minLength(2)]],
      timeBEscudo: [''],
      data: [null, Validators.required],
      campeonato: ['', Validators.required],
      status: ['aberto'],
      resultadoTimeA: [null],
      resultadoTimeB: [null],
    });
  }

  private loadGame() {
    if (!this.gameId) return;

    this.loading = true;
    this.jogoService.getJogoById(this.gameId).subscribe({
      next: (jogo) => {
        this.populateForm(jogo);
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
        this.goBack();
      },
    });
  }

  private populateForm(jogo: Jogo) {
    this.gameForm.patchValue({
      timeANome: jogo.timeA?.nome || '',
      timeAEscudo: jogo.timeA?.escudo || '',
      timeBNome: jogo.timeB?.nome || '',
      timeBEscudo: jogo.timeB?.escudo || '',
      data: jogo.data ? new Date(jogo.data) : null,
      campeonato: jogo.campeonato,
      status: jogo.status,
      resultadoTimeA: jogo.resultado?.timeA || null,
      resultadoTimeB: jogo.resultado?.timeB || null,
    });
  }

  onSubmit() {
    if (this.gameForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    const formData = this.prepareFormData();

    if (this.isEditMode && this.gameId) {
      this.updateGame(formData as JogoUpdate);
    } else {
      this.createGame(formData as JogoCreate);
    }
  }

  private prepareFormData(): JogoCreate | JogoUpdate {
    const formValue = this.gameForm.value;
    const baseData: any = {
      timeA: {
        nome: formValue.timeANome,
        escudo: formValue.timeAEscudo || '',
      },
      timeB: {
        nome: formValue.timeBNome,
        escudo: formValue.timeBEscudo || '',
      },
      data: formValue.data ? formValue.data.toISOString() : '',
      campeonato: formValue.campeonato,
      status: formValue.status,
    };

    if (formValue.status === 'encerrado') {
      baseData.resultado = {
        timeA: formValue.resultadoTimeA || 0,
        timeB: formValue.resultadoTimeB || 0,
      };
    }

    return baseData;
  }

  private createGame(gameData: JogoCreate) {
    this.jogoService.createJogo(gameData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Jogo criado com sucesso',
        });
        this.submitting = false;
        this.router.navigate(['/games']);
      },
      error: (error) => {
        console.error('Erro ao criar jogo:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao criar jogo',
        });
        this.submitting = false;
      },
    });
  }

  private updateGame(gameData: JogoUpdate) {
    if (!this.gameId) return;

    this.jogoService.updateJogo(this.gameId, gameData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Jogo atualizado com sucesso',
        });
        this.submitting = false;
        this.router.navigate(['/games']);
      },
      error: (error) => {
        console.error('Erro ao atualizar jogo:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao atualizar jogo',
        });
        this.submitting = false;
      },
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.gameForm.controls).forEach((key) => {
      const control = this.gameForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.gameForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  goBack() {
    this.router.navigate(['/games']);
  }
}
