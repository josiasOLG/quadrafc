import { z } from 'zod';

export const TransacaoReferenciaSchema = z.object({
  tipo: z.enum(['palpite', 'loja', 'missao', 'conquista', 'indicacao', 'evento']),
  id: z.string()
});

export const TransacaoMetodoPagamentoSchema = z.object({
  tipo: z.enum(['pix', 'cartao', 'ted', 'boleto']),
  dados: z.any()
});

export const TransacaoMoedaSchema = z.object({
  _id: z.string().optional(),
  usuario: z.string().min(1, 'Usuário é obrigatório'),
  tipo: z.enum(['compra', 'gasto', 'premio', 'bonus', 'reembolso', 'transferencia']),
  valor: z.number().min(0.01, 'Valor deve ser maior que 0'),
  saldo_anterior: z.number().min(0),
  saldo_atual: z.number().min(0),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  referencia: TransacaoReferenciaSchema.optional(),
  metodo_pagamento: TransacaoMetodoPagamentoSchema.optional(),
  status: z.enum(['pendente', 'processando', 'concluida', 'falhada', 'cancelada']),
  taxa: z.number().min(0).optional(),
  data_transacao: z.coerce.date(),
  data_processamento: z.coerce.date().optional(),
  comprovante: z.string().optional(),
  observacoes: z.string().optional()
});

export const CreateTransacaoMoedaSchema = z.object({
  tipo: z.enum(['compra', 'gasto', 'premio', 'bonus', 'reembolso', 'transferencia']),
  valor: z.number().min(0.01, 'Valor deve ser maior que 0'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  referencia: TransacaoReferenciaSchema.optional(),
  metodo_pagamento: TransacaoMetodoPagamentoSchema.optional()
});

export type TransacaoMoeda = z.infer<typeof TransacaoMoedaSchema>;
export type CreateTransacaoMoedaDto = z.infer<typeof CreateTransacaoMoedaSchema>;
export type TransacaoReferencia = z.infer<typeof TransacaoReferenciaSchema>;
export type TransacaoMetodoPagamento = z.infer<typeof TransacaoMetodoPagamentoSchema>;
