import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';

import { Jogo, JogoCreate, JogoUpdate } from '../../../shared/models/jogo.model';
import { JogoService } from '../../../shared/services/jogo.service';

@Component({
  selector: 'app-game-form',
  standalone: true,
  templateUrl: './game-form.component.html',
  styleUrls: ['./game-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    InputNumberModule,
    InputTextareaModule,
    CheckboxModule,
    ToastModule,
    ProgressSpinnerModule,
    DividerModule,
  ],
  providers: [MessageService],
})
export class GameFormComponent implements OnInit {
  gameForm!: FormGroup;
  loading = false;
  isEditMode = false;
  gameId: number | null = null;

  campeonatoOptions = [
    { label: 'Brasileirão Série A', value: 'brasileirao-a' },
    { label: 'Brasileirão Série B', value: 'brasileirao-b' },
    { label: 'Copa do Brasil', value: 'copa-brasil' },
    { label: 'Libertadores', value: 'libertadores' },
    { label: 'Sul-Americana', value: 'sul-americana' },
    { label: 'Campeonato Carioca', value: 'carioca' },
    { label: 'Campeonato Paulista', value: 'paulista' },
    { label: 'Outros', value: 'outros' },
  ];

  statusOptions = [
    { label: 'Agendado', value: 'agendado' },
    { label: 'Em Andamento', value: 'em_andamento' },
    { label: 'Finalizado', value: 'finalizado' },
    { label: 'Adiado', value: 'adiado' },
    { label: 'Cancelado', value: 'cancelado' },
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
        this.gameId = +params['id'];
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
      dataHora: [null, Validators.required],
      campeonato: ['', Validators.required],
      rodada: [null],
      estadio: [''],
      cidade: [''],
      estado: [''],
      status: ['aberto'],
      permitePalpites: [true],
      golsMandante: [null],
      golsVisitante: [null],
      observacoes: [''],
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
      dataHora: jogo.data ? new Date(jogo.data) : null,
      campeonato: jogo.campeonato,
      rodada: jogo.rodada || null,
      estadio: jogo.estadio || '',
      cidade: jogo.cidade || '',
      estado: jogo.estado || '',
      status: jogo.status,
      permitePalpites: jogo.status === 'aberto',
      golsMandante: jogo.resultado?.timeA || null,
      golsVisitante: jogo.resultado?.timeB || null,
      observacoes: jogo.observacoes || '',
    });
  }

  onSubmit() {
    if (this.gameForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formData = this.prepareFormData();

    if (this.isEditMode && this.gameId) {
      this.updateGame(formData as JogoUpdate);
    } else {
      this.createGame(formData as JogoCreate);
    }
  }

  private prepareFormData(): JogoCreate | JogoUpdate {
    const formValue = this.gameForm.value;
    const baseData = {
      timeA: {
        nome: formValue.timeANome,
        escudo: formValue.timeAEscudo || '',
      },
      timeB: {
        nome: formValue.timeBNome,
        escudo: formValue.timeBEscudo || '',
      },
      data: formValue.dataHora ? formValue.dataHora.toISOString() : '',
      campeonato: formValue.campeonato,
      rodada: formValue.rodada || undefined,
      estadio: formValue.estadio || undefined,
      cidade: formValue.cidade || undefined,
      estado: formValue.estado || undefined,
      status: formValue.status,
      observacoes: formValue.observacoes || undefined,
      resultado:
        formValue.status === 'encerrado' &&
        (formValue.golsMandante !== null || formValue.golsVisitante !== null)
          ? {
              timeA: formValue.golsMandante || 0,
              timeB: formValue.golsVisitante || 0,
            }
          : undefined,
    };

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
        this.loading = false;
        this.router.navigate(['/games']);
      },
      error: (error) => {
        console.error('Erro ao criar jogo:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao criar jogo',
        });
        this.loading = false;
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
        this.loading = false;
        this.router.navigate(['/games']);
      },
      error: (error) => {
        console.error('Erro ao atualizar jogo:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao atualizar jogo',
        });
        this.loading = false;
      },
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.gameForm.controls).forEach((key) => {
      const control = this.gameForm.get(key);
      control?.markAsTouched();

      // Marca campos aninhados também
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach((nestedKey) => {
          control.get(nestedKey)?.markAsTouched();
        });
      }
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
