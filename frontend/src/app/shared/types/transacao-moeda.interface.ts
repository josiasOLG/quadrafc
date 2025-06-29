export interface TransacaoMoeda {
  _id?: string;
  usuario: string;
  tipo: 'compra' | 'gasto' | 'premio' | 'bonus' | 'reembolso' | 'transferencia';
  valor: number;
  saldo_anterior: number;
  saldo_atual: number;
  descricao: string;
  referencia?: {
    tipo: 'palpite' | 'loja' | 'missao' | 'conquista' | 'indicacao' | 'evento';
    id: string;
  };
  metodo_pagamento?: {
    tipo: 'pix' | 'cartao' | 'ted' | 'boleto';
    dados: any;
  };
  status: 'pendente' | 'processando' | 'concluida' | 'falhada' | 'cancelada';
  taxa?: number;
  data_transacao: Date;
  data_processamento?: Date;
  comprovante?: string;
  observacoes?: string;
}

export interface CreateTransacaoMoedaDto {
  tipo: 'compra' | 'gasto' | 'premio' | 'bonus' | 'reembolso' | 'transferencia';
  valor: number;
  descricao: string;
  referencia?: {
    tipo: 'palpite' | 'loja' | 'missao' | 'conquista' | 'indicacao' | 'evento';
    id: string;
  };
  metodo_pagamento?: {
    tipo: 'pix' | 'cartao' | 'ted' | 'boleto';
    dados: any;
  };
}
