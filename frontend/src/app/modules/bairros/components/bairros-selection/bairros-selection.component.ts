import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BairrosService } from '../../services/bairros.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Bairro } from '../../../../shared/schemas/bairro.schema';

@Component({
  selector: 'app-bairros-selection',
  templateUrl: './bairros-selection.component.html',
  styleUrls: ['./bairros-selection.component.scss']
})
export class BairrosSelectionComponent implements OnInit {
  bairros: Bairro[] = [];
  filteredBairros: Bairro[] = [];
  selectedBairro: Bairro | null = null;
  searchTerm: string = '';
  loading = false;
  submitting = false;

  constructor(
    private bairrosService: BairrosService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBairros();
  }

  loadBairros(): void {
    this.loading = true;
    this.bairrosService.getAll().subscribe({
      next: (response) => {
        this.bairros = response.data;
        this.filteredBairros = response.data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar bairros:', error);
        this.toastService.error('Erro ao carregar bairros');
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    if (this.searchTerm.trim() === '') {
      this.filteredBairros = this.bairros;
    } else {
      this.filteredBairros = this.bairros.filter(bairro =>
        bairro.nome.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  selectBairro(bairro: Bairro): void {
    this.selectedBairro = bairro;
  }

  onConfirm(): void {
    if (!this.selectedBairro) {
      this.toastService.warn('Selecione um bairro para continuar');
      return;
    }

    this.submitting = true;
    this.authService.updateProfile({ bairro: this.selectedBairro._id }).subscribe({
      next: () => {
        this.toastService.success(`Bairro ${this.selectedBairro!.nome} selecionado com sucesso!`);
        this.router.navigate(['/jogos']);
      },
      error: (error: any) => {
        console.error('Erro ao atualizar bairro:', error);
        this.toastService.error('Erro ao selecionar bairro');
        this.submitting = false;
      }
    });
  }

  onSkip(): void {
    this.router.navigate(['/jogos']);
  }

  trackByBairroId(index: number, bairro: Bairro): string {
    return bairro._id || `${index}`;
  }
}
