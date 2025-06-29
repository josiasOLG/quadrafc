import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { LojaService } from '../../services/loja.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { User } from '../../../../shared/schemas/user.schema';

interface ItemLoja {
  id: string;
  nome: string;
  descricao: string;
  categoria: 'avatar' | 'tema' | 'adesivo' | 'emoji' | 'powerup';
  preco_moedas: number;
  preco_pontos?: number;
  icone?: string;
  imagem?: string;
  raridade: 'comum' | 'raro' | 'epico' | 'lendario';
  disponivel: boolean;
  limitado?: boolean;
  data_limite?: Date;
  efeito?: string;
  ja_possui?: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  itens: ItemLoja[];
}

@Component({
  selector: 'app-loja-list',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    BadgeModule,
    TagModule,
    TabViewModule,
    SkeletonModule,
    DialogModule,
    ConfirmDialogModule,
    CurrencyFormatPipe
  ],
  templateUrl: './loja-list.component.html',
  styleUrls: ['./loja-list.component.scss']
})
export class LojaListComponent implements OnInit {
  user: User | null = null;
  categorias: Categoria[] = [];
  isLoading = true;
  selectedItem: ItemLoja | null = null;
  showConfirmDialog = false;
  isComprandoItem = false;

  constructor(
    private lojaService: LojaService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadItensLoja();
  }

  private loadUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  private async loadItensLoja(): Promise<void> {
    this.isLoading = true;

    try {
      // Simular dados da loja (em produção viria do serviço)
      this.categorias = [
        {
          id: 'avatares',
          nome: 'Avatares',
          icone: 'pi-user',
          itens: [
            {
              id: 'avatar-1',
              nome: 'Avatar Campeão',
              descricao: 'Avatar exclusivo para verdadeiros campeões',
              categoria: 'avatar',
              preco_moedas: 500,
              icone: 'pi-star',
              raridade: 'epico',
              disponivel: true,
              ja_possui: false
            },
            {
              id: 'avatar-2',
              nome: 'Avatar Lendário',
              descricao: 'O avatar mais raro da loja',
              categoria: 'avatar',
              preco_moedas: 1000,
              icone: 'pi-crown',
              raridade: 'lendario',
              disponivel: true,
              limitado: true,
              data_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              ja_possui: false
            }
          ]
        },
        {
          id: 'temas',
          nome: 'Temas',
          icone: 'pi-palette',
          itens: [
            {
              id: 'tema-1',
              nome: 'Tema Escuro Premium',
              descricao: 'Tema escuro com detalhes dourados',
              categoria: 'tema',
              preco_moedas: 300,
              icone: 'pi-moon',
              raridade: 'raro',
              disponivel: true,
              ja_possui: false
            },
            {
              id: 'tema-2',
              nome: 'Tema Cores do Brasil',
              descricao: 'Tema com as cores da nossa bandeira',
              categoria: 'tema',
              preco_moedas: 250,
              icone: 'pi-flag',
              raridade: 'comum',
              disponivel: true,
              ja_possui: false
            }
          ]
        },
        {
          id: 'powerups',
          nome: 'Power-ups',
          icone: 'pi-bolt',
          itens: [
            {
              id: 'powerup-1',
              nome: 'Dobro de Pontos',
              descricao: 'Dobra os pontos do próximo palpite correto',
              categoria: 'powerup',
              preco_moedas: 100,
              icone: 'pi-plus',
              raridade: 'comum',
              disponivel: true,
              efeito: 'Multiplica por 2 os pontos do próximo acerto',
              ja_possui: false
            },
            {
              id: 'powerup-2',
              nome: 'Proteção de Sequência',
              descricao: 'Protege sua sequência em caso de erro no próximo palpite',
              categoria: 'powerup',
              preco_moedas: 150,
              icone: 'pi-shield',
              raridade: 'raro',
              disponivel: true,
              efeito: 'Evita quebrar a sequência uma vez',
              ja_possui: false
            }
          ]
        }
      ];

    } catch (error) {
      console.error('Erro ao carregar itens da loja:', error);
      this.toastService.show({
        detail: 'Erro ao carregar itens da loja',
        severity: 'error'
      });
    } finally {
      this.isLoading = false;
    }
  }

  openConfirmDialog(item: ItemLoja): void {
    if (!this.canBuyItem(item)) {
      return;
    }

    this.selectedItem = item;
    this.showConfirmDialog = true;
  }

  closeConfirmDialog(): void {
    this.selectedItem = null;
    this.showConfirmDialog = false;
  }

  async comprarItem(): Promise<void> {
    if (!this.selectedItem || !this.user) {
      return;
    }

    this.isComprandoItem = true;

    try {
      // Simular compra (em produção chamaria o serviço)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Atualizar moedas do usuário (simulado)
      const novasMoedas = (this.user.moedas || 0) - this.selectedItem.preco_moedas;

      this.toastService.show({
        detail: `${this.selectedItem.nome} comprado com sucesso!`,
        severity: 'success'
      });

      // Marcar item como possuído
      this.selectedItem.ja_possui = true;

      this.closeConfirmDialog();

    } catch (error) {
      console.error('Erro ao comprar item:', error);
      this.toastService.show({
        detail: 'Erro ao comprar item',
        severity: 'error'
      });
    } finally {
      this.isComprandoItem = false;
    }
  }

  canBuyItem(item: ItemLoja): boolean {
    if (!this.user || item.ja_possui || !item.disponivel) {
      return false;
    }

    return (this.user.moedas || 0) >= item.preco_moedas;
  }

  getRaridadeSeverity(raridade: string): string {
    switch (raridade) {
      case 'comum': return 'secondary';
      case 'raro': return 'info';
      case 'epico': return 'warning';
      case 'lendario': return 'danger';
      default: return 'secondary';
    }
  }

  getItemStatusLabel(item: ItemLoja): { label: string; severity: string } | null {
    if (item.ja_possui) {
      return { label: 'Possuído', severity: 'success' };
    }

    if (!item.disponivel) {
      return { label: 'Indisponível', severity: 'secondary' };
    }

    if (item.limitado && item.data_limite) {
      const agora = new Date();
      const limite = new Date(item.data_limite);
      if (agora > limite) {
        return { label: 'Expirado', severity: 'danger' };
      }
      return { label: 'Limitado', severity: 'warning' };
    }

    return null;
  }

  isItemExpired(item: ItemLoja): boolean {
    if (!item.limitado || !item.data_limite) {
      return false;
    }

    return new Date() > new Date(item.data_limite);
  }

  trackByCategoria(index: number, categoria: Categoria): string {
    return categoria.id;
  }

  trackByItem(index: number, item: ItemLoja): string {
    return item.id;
  }
}
