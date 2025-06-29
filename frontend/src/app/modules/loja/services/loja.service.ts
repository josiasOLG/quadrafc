import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../shared/services/base-api.service';
import { TransacaoMoeda, CreateTransacaoMoedaDto, PaginationParams } from '../../../shared/schemas';
import { HttpService } from '../../../shared/services/http.service';

export interface ItemLoja {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  tipo: 'avatar' | 'tema' | 'badge' | 'boost' | 'especial';
  categoria: string;
  imagem_url: string;
  disponivel: boolean;
  limitado: boolean;
  data_expiracao?: Date;
  nivel_minimo: number;
}

export interface CompraRequest {
  item_id: string;
  quantidade?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LojaService extends BaseApiService<TransacaoMoeda, CreateTransacaoMoedaDto> {
  protected readonly endpoint = 'transacoes-moedas';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  // Métodos específicos para a loja
  getItensLoja(): Observable<ItemLoja[]> {
    return this.httpService.get<ItemLoja[]>('loja/itens');
  }

  getItensPorCategoria(categoria: string): Observable<ItemLoja[]> {
    return this.httpService.get<ItemLoja[]>(`loja/categoria/${categoria}`);
  }

  getItensPorTipo(tipo: 'avatar' | 'tema' | 'badge' | 'boost' | 'especial'): Observable<ItemLoja[]> {
    return this.httpService.get<ItemLoja[]>(`loja/tipo/${tipo}`);
  }

  getItensLimitados(): Observable<ItemLoja[]> {
    return this.httpService.get<ItemLoja[]>('loja/limitados');
  }

  getMeusItens(): Observable<Array<{
    item: ItemLoja;
    data_compra: Date;
    ativo: boolean;
  }>> {
    return this.httpService.get('loja/meus-itens');
  }

  comprarItem(compra: CompraRequest): Observable<{
    transacao: TransacaoMoeda;
    novo_saldo: number;
    item: ItemLoja;
  }> {
    return this.httpService.post('loja/comprar', compra);
  }

  // Métodos para transações
  getMinhasTransacoes(params?: PaginationParams): Observable<{ data: TransacaoMoeda[]; pagination: any }> {
    return this.getPaginated<TransacaoMoeda>('minhas', params);
  }

  getTransacoesPorTipo(tipo: 'compra' | 'gasto' | 'premio' | 'bonus' | 'reembolso' | 'transferencia', params?: PaginationParams): Observable<{ data: TransacaoMoeda[]; pagination: any }> {
    return this.getPaginated<TransacaoMoeda>(`tipo/${tipo}`, params);
  }

  getMeuSaldoAtual(): Observable<{ saldo: number; historico_7_dias: number[] }> {
    return this.get('meu-saldo');
  }

  getExtrato(periodo?: 'semana' | 'mes' | 'ano'): Observable<TransacaoMoeda[]> {
    return this.get('extrato', { periodo });
  }

  // Transferir moedas (se permitido)
  transferirMoedas(destinatario_id: string, valor: number, descricao?: string): Observable<TransacaoMoeda> {
    return this.post('transferir', { destinatario_id, valor, descricao });
  }

  // Resgatar código promocional
  resgatarCodigo(codigo: string): Observable<{
    transacao: TransacaoMoeda;
    novo_saldo: number;
    bonus: number;
  }> {
    return this.httpService.post('loja/resgatar-codigo', { codigo });
  }

  // Histórico de compras
  getHistoricoCompras(params?: PaginationParams): Observable<{ data: Array<{
    item: ItemLoja;
    transacao: TransacaoMoeda;
    data_compra: Date;
  }>; pagination: any }> {
    return this.httpService.getPaginated('loja/historico-compras', params);
  }

  // Estatísticas de gastos
  getEstatisticasGastos(): Observable<{
    total_gasto: number;
    gasto_medio_mensal: number;
    categoria_mais_gasta: string;
    itens_comprados: number;
    economia_total: number;
  }> {
    return this.get('estatisticas-gastos');
  }

  // Admin: Gerenciar itens da loja
  criarItemLoja(item: Omit<ItemLoja, 'id'>): Observable<ItemLoja> {
    return this.httpService.post('admin/loja/itens', item);
  }

  atualizarItemLoja(itemId: string, item: Partial<ItemLoja>): Observable<ItemLoja> {
    return this.httpService.put(`admin/loja/itens/${itemId}`, item);
  }

  removerItemLoja(itemId: string): Observable<void> {
    return this.httpService.delete(`admin/loja/itens/${itemId}`);
  }

  // Admin: Estatísticas da loja
  getEstatisticasLojaAdmin(): Observable<{
    total_vendas: number;
    receita_total: number;
    item_mais_vendido: string;
    usuarios_compradores: number;
    ticket_medio: number;
  }> {
    return this.httpService.get('admin/loja/estatisticas');
  }
}
