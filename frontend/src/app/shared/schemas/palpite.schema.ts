import { z } from 'zod';

export const PalpiteSchema = z.object({
  _id: z.string().optional(),
  usuario: z.string(),
  jogo: z.string(),
  tipo_palpite: z.enum(['resultado', 'placar_exato', 'ambas_marcam', 'total_gols', 'primeiro_gol', 'handicap']),
  valor_palpite: z.any(),
  odds: z.number().min(1),
  valor_aposta: z.number().min(1),
  data_palpite: z.coerce.date(),
  status: z.enum(['pendente', 'ganhou', 'perdeu', 'cancelado', 'empate']),
  valor_ganho: z.number().optional(),
  pontos_ganhos: z.number().optional(),
  data_resultado: z.coerce.date().optional(),
  multiplicador: z.number().optional(),
  bonus_aplicado: z.object({
    tipo: z.string(),
    valor: z.number(),
    motivo: z.string()
  }).optional()
});

export const CreatePalpiteSchema = z.object({
  jogo: z.string().min(1, 'Jogo é obrigatório'),
  tipo_palpite: z.enum(['resultado', 'placar_exato', 'ambas_marcam', 'total_gols', 'primeiro_gol', 'handicap']),
  valor_palpite: z.any(),
  odds: z.number().min(1, 'Odds deve ser maior que 1'),
  valor_aposta: z.number().min(1, 'Valor da aposta deve ser maior que 0')
});

export type Palpite = z.infer<typeof PalpiteSchema>;
export type CreatePalpiteDto = z.infer<typeof CreatePalpiteSchema>;
