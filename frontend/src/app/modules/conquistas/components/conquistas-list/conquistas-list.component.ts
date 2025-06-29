import { Component, OnInit } from '@angular/core';
import { ConquistasService } from '../../services/conquistas.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Conquista, ConquistaUsuario } from '../../../../shared/schemas';

@Component({
  selector: 'app-conquistas-list',
  templateUrl: './conquistas-list.component.html',
  styleUrls: ['./conquistas-list.component.scss']
})
export class ConquistasListComponent implements OnInit {
  conquistasCompletas: ConquistaUsuario[] = [];
  conquistasProgresso: ConquistaUsuario[] = [];
  conquistasDisponiveis: Conquista[] = [];
  estatisticas: any = null;
  loading = false;
  activeTab = 0;

  categorias = [
    { value: 'palpites', label: 'Palpites', icon: 'pi pi-star' },
    { value: 'sequencia', label: 'Sequência', icon: 'pi pi-chart-line' },
    { value: 'participacao', label: 'Participação', icon: 'pi pi-calendar' },
    { value: 'social', label: 'Social', icon: 'pi pi-users' },
    { value: 'nivel', label: 'Nível', icon: 'pi pi-trophy' }
  ];

  tipos = {
    bronze: { label: 'Bronze', color: '#CD7F32', icon: 'pi pi-circle' },
    prata: { label: 'Prata', color: '#C0C0C0', icon: 'pi pi-circle' },
    ouro: { label: 'Ouro', color: '#FFD700', icon: 'pi pi-star' },
    diamante: { label: 'Diamante', color: '#B9F2FF', icon: 'pi pi-diamond' }
  };

  constructor(
    private conquistasService: ConquistasService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadConquistas();
    this.loadEstatisticas();
  }

  loadConquistas(): void {
    this.loading = true;

    // Carregar conquistas completas
    this.conquistasService.getMinhasConquistas().subscribe({
      next: (response: any) => {
        this.conquistasCompletas = response.data.filter((c: ConquistaUsuario) => c.completada);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar conquistas completas:', error);
        this.loading = false;
      }
    });

    // Carregar progresso
    this.conquistasService.getProgressoConquistas().subscribe({
      next: (response: any) => {
        this.conquistasProgresso = response.data.filter((c: ConquistaUsuario) => !c.completada);
      },
      error: (error: any) => {
        console.error('Erro ao carregar progresso:', error);
      }
    });

    // Carregar disponíveis
    this.conquistasService.getConquistasDisponiveis().subscribe({
      next: (response: any) => {
        this.conquistasDisponiveis = response.data;
      },
      error: (error: any) => {
        console.error('Erro ao carregar conquistas disponíveis:', error);
      }
    });
  }

  loadEstatisticas(): void {
    this.conquistasService.getEstatisticasConquistas().subscribe({
      next: (stats) => {
        this.estatisticas = stats;
      },
      error: (error: any) => {
        console.error('Erro ao carregar estatísticas:', error);
      }
    });
  }

  reivindicarConquista(conquista: ConquistaUsuario): void {
    if (!conquista._id) return;

    this.conquistasService.reivindicarConquista(conquista._id).subscribe({
      next: (response) => {
        this.toastService.success('Conquista reivindicada com sucesso!');
        this.loadConquistas();
        this.loadEstatisticas();
      },
      error: (error: any) => {
        console.error('Erro ao reivindicar conquista:', error);
        this.toastService.error('Erro ao reivindicar conquista');
      }
    });
  }

  getProgressoPercentual(conquista: ConquistaUsuario): number {
    if (conquista.progresso_necessario === 0) return 100;
    return Math.min(100, (conquista.progresso_atual / conquista.progresso_necessario) * 100);
  }

  getCategoriaInfo(categoria: string): any {
    return this.categorias.find(c => c.value === categoria) || { label: categoria, icon: 'pi pi-circle' };
  }

  getTipoInfo(tipo: string): any {
    return this.tipos[tipo as keyof typeof this.tipos] || { label: tipo, color: '#666', icon: 'pi pi-circle' };
  }

  getConquistasPorCategoria(categoria: string, lista: ConquistaUsuario[] | Conquista[]): any[] {
    return lista.filter((item: any) => {
      const conquista = 'conquista' in item ? item.conquista : item;
      return conquista.categoria === categoria;
    });
  }

  trackByConquistaId(index: number, item: ConquistaUsuario | Conquista): string {
    return item._id || `${index}`;
  }
}
