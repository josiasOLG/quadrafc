import { z } from 'zod';

export const RodadaPremiacaoSchema = z.object({
  primeiro_lugar: z.number().min(0),
  segundo_lugar: z.number().min(0),
  terceiro_lugar: z.number().min(0),
  participacao: z.number().min(0)
});

export const RodadaEstatisticasSchema = z.object({
  total_palpites: z.number().min(0),
  total_apostadores: z.number().min(0),
  valor_total_apostado: z.number().min(0),
  maior_premio: z.number().min(0),
  palpite_mais_comum: z.string()
});

export const RodadaSchema = z.object({
  _id: z.string().optional(),
  numero: z.number().min(1, 'Número da rodada deve ser maior que 0'),
  campeonato: z.string().min(2, 'Campeonato é obrigatório'),
  temporada: z.string().min(4, 'Temporada é obrigatória'),
  data_inicio: z.coerce.date(),
  data_fim: z.coerce.date(),
  status: z.enum(['agendada', 'em_andamento', 'finalizada']),
  jogos: z.array(z.string()),
  premiacao: RodadaPremiacaoSchema,
  estatisticas: RodadaEstatisticasSchema,
  data_criacao: z.coerce.date()
});

export const CreateRodadaSchema = z.object({
  numero: z.number().min(1, 'Número da rodada deve ser maior que 0'),
  campeonato: z.string().min(2, 'Campeonato é obrigatório'),
  temporada: z.string().min(4, 'Temporada é obrigatória'),
  data_inicio: z.coerce.date(),
  data_fim: z.coerce.date()
});

export type Rodada = z.infer<typeof RodadaSchema>;
export type CreateRodadaDto = z.infer<typeof CreateRodadaSchema>;
export type RodadaPremiacao = z.infer<typeof RodadaPremiacaoSchema>;
export type RodadaEstatisticas = z.infer<typeof RodadaEstatisticasSchema>;
