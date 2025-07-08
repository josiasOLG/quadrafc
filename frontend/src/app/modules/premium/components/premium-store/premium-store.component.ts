import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { PremiumPermissionsService } from '../../../../core/services/premium-permissions.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { User } from '../../../../shared/schemas/user.schema';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RankingService } from '../../../ranking/services/ranking.service';

interface CidadeOption {
  label: string;
  value: string;
  estado: string;
}

interface EstadoOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-premium-store',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    DropdownModule,
    TooltipModule,
    PageHeaderComponent,
    CurrencyFormatPipe,
  ],
  templateUrl: './premium-store.component.html',
  styleUrls: ['./premium-store.component.scss'],
})
export class PremiumStoreComponent implements OnInit {
  user: User | null = null;
  isLoading = false;
  // Funções trackBy para performance em *ngFor
  trackByEstado(index: number, estado: string): string {
    return estado;
  }
  trackByCidade(index: number, cidade: { cidade: string; estado: string }): string {
    return `${cidade.cidade}-${cidade.estado}`;
  }

  // Dados de custos e acessos
  custos = {
    cidade: 50,
    estado: 100,
    nacional: 200,
    assinaturaPremiumMensal: 500,
  };

  acessosUsuario = {
    assinaturaPremium: false,
    dataVencimentoPremium: null as Date | null,
    estadosAcessiveis: [] as string[],
    cidadesAcessiveis: [] as { cidade: string; estado: string }[],
    temAcessoNacional: false,
  };

  // Opções para dropdowns
  cidadesDisponiveis: CidadeOption[] = [
    { label: 'São Paulo - SP', value: 'São Paulo', estado: 'SP' },
    { label: 'Rio de Janeiro - RJ', value: 'Rio de Janeiro', estado: 'RJ' },
    { label: 'Belo Horizonte - MG', value: 'Belo Horizonte', estado: 'MG' },
    { label: 'Salvador - BA', value: 'Salvador', estado: 'BA' },
    { label: 'Brasília - DF', value: 'Brasília', estado: 'DF' },
    { label: 'Fortaleza - CE', value: 'Fortaleza', estado: 'CE' },
    { label: 'Manaus - AM', value: 'Manaus', estado: 'AM' },
    { label: 'Curitiba - PR', value: 'Curitiba', estado: 'PR' },
    { label: 'Recife - PE', value: 'Recife', estado: 'PE' },
    { label: 'Porto Alegre - RS', value: 'Porto Alegre', estado: 'RS' },
  ];

  estadosDisponiveis: EstadoOption[] = [
    { label: 'São Paulo', value: 'SP' },
    { label: 'Rio de Janeiro', value: 'RJ' },
    { label: 'Minas Gerais', value: 'MG' },
    { label: 'Bahia', value: 'BA' },
    { label: 'Distrito Federal', value: 'DF' },
    { label: 'Ceará', value: 'CE' },
    { label: 'Amazonas', value: 'AM' },
    { label: 'Paraná', value: 'PR' },
    { label: 'Pernambuco', value: 'PE' },
    { label: 'Rio Grande do Sul', value: 'RS' },
  ];

  // Seleções atuais
  cidadeSelecionada: CidadeOption | null = null;
  estadoSelecionado: EstadoOption | null = null;

  // Modais
  showConfirmDialog = false;
  confirmAction: (() => void) | null = null;
  confirmMessage = '';
  confirmTitle = '';

  constructor(
    private authService: AuthService,
    private rankingService: RankingService,
    private premiumPermissionsService: PremiumPermissionsService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadPermissions();
  }

  private loadUser(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
  }

  private loadPermissions(): void {
    const permissions = this.premiumPermissionsService.currentPermissions;
    if (permissions) {
      this.acessosUsuario = {
        ...permissions.acessos,
        dataVencimentoPremium: permissions.acessos.dataVencimentoPremium || null,
      };
      this.custos = permissions.custos;
    } else {
      // Carregar do backend se não estiver em cache
      this.premiumPermissionsService.loadPermissions().subscribe((permissions) => {
        if (permissions) {
          this.acessosUsuario = {
            ...permissions.acessos,
            dataVencimentoPremium: permissions.acessos.dataVencimentoPremium || null,
          };
          this.custos = permissions.custos;
        }
      });
    }
  }

  // Verificações de acesso
  jaTemAcessoCidade(cidade: string, estado: string): boolean {
    if (this.acessosUsuario.assinaturaPremium) return true;
    return this.acessosUsuario.cidadesAcessiveis.some(
      (c) => c.cidade === cidade && c.estado === estado
    );
  }

  jaTemAcessoEstado(estado: string): boolean {
    if (this.acessosUsuario.assinaturaPremium) return true;
    return this.acessosUsuario.estadosAcessiveis.includes(estado);
  }

  jaTemAcessoNacional(): boolean {
    return this.acessosUsuario.assinaturaPremium || this.acessosUsuario.temAcessoNacional;
  }

  // Verificações de saldo
  temSaldoSuficiente(custo: number): boolean {
    return this.user ? this.user.moedas >= custo : false;
  }

  // Métodos de compra
  confirmarCompraCidade(): void {
    if (!this.cidadeSelecionada) {
      this.toastService.show({
        detail: 'Selecione uma cidade para comprar',
        severity: 'warn',
      });
      return;
    }

    if (this.jaTemAcessoCidade(this.cidadeSelecionada.value, this.cidadeSelecionada.estado)) {
      this.toastService.show({
        detail: 'Você já tem acesso a esta cidade',
        severity: 'info',
      });
      return;
    }

    if (!this.temSaldoSuficiente(this.custos.cidade)) {
      this.toastService.show({
        detail: 'Saldo insuficiente para esta compra',
        severity: 'error',
      });
      return;
    }

    this.confirmTitle = 'Confirmar Compra';
    this.confirmMessage = `Deseja comprar acesso à cidade ${this.cidadeSelecionada.label} por ${this.custos.cidade} moedas?`;
    this.confirmAction = () => this.comprarAcessoCidade();
    this.showConfirmDialog = true;
  }

  confirmarCompraEstado(): void {
    if (!this.estadoSelecionado) {
      this.toastService.show({
        detail: 'Selecione um estado para comprar',
        severity: 'warn',
      });
      return;
    }

    if (this.jaTemAcessoEstado(this.estadoSelecionado.value)) {
      this.toastService.show({
        detail: 'Você já tem acesso a este estado',
        severity: 'info',
      });
      return;
    }

    if (!this.temSaldoSuficiente(this.custos.estado)) {
      this.toastService.show({
        detail: 'Saldo insuficiente para esta compra',
        severity: 'error',
      });
      return;
    }

    this.confirmTitle = 'Confirmar Compra';
    this.confirmMessage = `Deseja comprar acesso ao estado ${this.estadoSelecionado.label} por ${this.custos.estado} moedas?`;
    this.confirmAction = () => this.comprarAcessoEstado();
    this.showConfirmDialog = true;
  }

  confirmarCompraNacional(): void {
    if (this.jaTemAcessoNacional()) {
      this.toastService.show({
        detail: 'Você já tem acesso nacional',
        severity: 'info',
      });
      return;
    }

    if (!this.temSaldoSuficiente(this.custos.nacional)) {
      this.toastService.show({
        detail: 'Saldo insuficiente para esta compra',
        severity: 'error',
      });
      return;
    }

    this.confirmTitle = 'Confirmar Compra';
    this.confirmMessage = `Deseja comprar acesso nacional por ${this.custos.nacional} moedas?`;
    this.confirmAction = () => this.comprarAcessoNacional();
    this.showConfirmDialog = true;
  }

  confirmarAssinaturaPremium(): void {
    if (this.acessosUsuario.assinaturaPremium) {
      this.toastService.show({
        detail: 'Você já tem assinatura premium ativa',
        severity: 'info',
      });
      return;
    }

    if (!this.temSaldoSuficiente(this.custos.assinaturaPremiumMensal)) {
      this.toastService.show({
        detail: 'Saldo insuficiente para esta compra',
        severity: 'error',
      });
      return;
    }

    this.confirmTitle = 'Confirmar Assinatura Premium';
    this.confirmMessage = `Deseja contratar a assinatura premium por ${this.custos.assinaturaPremiumMensal} moedas/mês? Você terá acesso completo a todos os rankings!`;
    this.confirmAction = () => this.comprarAssinaturaPremium();
    this.showConfirmDialog = true;
  }

  // Métodos de compra efetivos
  private async comprarAcessoCidade(): Promise<void> {
    if (!this.cidadeSelecionada) return;

    this.isLoading = true;
    try {
      this.rankingService
        .comprarAcessoCidade(this.cidadeSelecionada.value, this.cidadeSelecionada.estado)
        .subscribe({
          next: (response) => {
            if (response.sucesso) {
              // Atualizar saldo do usuário
              if (this.user) {
                this.user.moedas = response.novoSaldoMoedas;
              }

              // Recarregar permissões
              this.premiumPermissionsService.refreshPermissions().subscribe(() => {
                this.loadPermissions();
              });

              this.toastService.show({
                detail: `Acesso à cidade ${this.cidadeSelecionada?.label} adquirido com sucesso!`,
                severity: 'success',
              });

              this.cidadeSelecionada = null;
            }
          },
          error: (error) => {
            this.toastService.show({
              detail: error.error?.message || 'Erro ao comprar acesso à cidade',
              severity: 'error',
            });
          },
          complete: () => {
            this.isLoading = false;
          },
        });
    } catch (error) {
      this.isLoading = false;
      this.toastService.show({
        detail: 'Erro ao comprar acesso à cidade',
        severity: 'error',
      });
    }
  }

  private async comprarAcessoEstado(): Promise<void> {
    if (!this.estadoSelecionado) return;

    this.isLoading = true;
    try {
      this.rankingService.comprarAcessoEstado(this.estadoSelecionado.value).subscribe({
        next: (response) => {
          if (response.sucesso) {
            // Atualizar saldo do usuário
            if (this.user) {
              this.user.moedas = response.novoSaldoMoedas;
            }

            // Recarregar permissões
            this.premiumPermissionsService.refreshPermissions().subscribe(() => {
              this.loadPermissions();
            });

            this.toastService.show({
              detail: `Acesso ao estado ${this.estadoSelecionado?.label} adquirido com sucesso!`,
              severity: 'success',
            });

            this.estadoSelecionado = null;
          }
        },
        error: (error) => {
          this.toastService.show({
            detail: error.error?.message || 'Erro ao comprar acesso ao estado',
            severity: 'error',
          });
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } catch (error) {
      this.isLoading = false;
      this.toastService.show({
        detail: 'Erro ao comprar acesso ao estado',
        severity: 'error',
      });
    }
  }

  private async comprarAcessoNacional(): Promise<void> {
    this.isLoading = true;
    try {
      this.rankingService.comprarAcessoNacional().subscribe({
        next: (response) => {
          if (response.sucesso) {
            // Atualizar saldo do usuário
            if (this.user) {
              this.user.moedas = response.novoSaldoMoedas;
            }

            // Recarregar permissões
            this.premiumPermissionsService.refreshPermissions().subscribe(() => {
              this.loadPermissions();
            });

            this.toastService.show({
              detail: 'Acesso nacional adquirido com sucesso!',
              severity: 'success',
            });
          }
        },
        error: (error) => {
          this.toastService.show({
            detail: error.error?.message || 'Erro ao comprar acesso nacional',
            severity: 'error',
          });
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } catch (error) {
      this.isLoading = false;
      this.toastService.show({
        detail: 'Erro ao comprar acesso nacional',
        severity: 'error',
      });
    }
  }

  private async comprarAssinaturaPremium(): Promise<void> {
    this.isLoading = true;
    try {
      this.rankingService.comprarAssinaturaPremium(1).subscribe({
        next: (response) => {
          if (response.sucesso) {
            // Atualizar saldo do usuário
            if (this.user) {
              this.user.moedas = response.novoSaldoMoedas;
            }

            // Recarregar permissões
            this.premiumPermissionsService.refreshPermissions().subscribe(() => {
              this.loadPermissions();
            });

            this.toastService.show({
              detail: 'Assinatura Premium ativada com sucesso! Você tem acesso completo por 1 mês.',
              severity: 'success',
            });
          }
        },
        error: (error) => {
          this.toastService.show({
            detail: error.error?.message || 'Erro ao contratar assinatura premium',
            severity: 'error',
          });
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } catch (error) {
      this.isLoading = false;
      this.toastService.show({
        detail: 'Erro ao contratar assinatura premium',
        severity: 'error',
      });
    }
  }

  // Controle do modal de confirmação
  confirmarAcao(): void {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.fecharConfirmDialog();
  }

  fecharConfirmDialog(): void {
    this.showConfirmDialog = false;
    this.confirmAction = null;
    this.confirmMessage = '';
    this.confirmTitle = '';
  }

  // Navegação
  voltarParaConfiguracoes(): void {
    this.router.navigate(['/configuracoes']);
  }
}
