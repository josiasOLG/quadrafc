import { z } from 'zod';

export const JogoResultadoSchema = z.object({
  gols_casa: z.number().min(0),
  gols_visitante: z.number().min(0),
  vencedor: z.enum(['casa', 'visitante', 'empate']).optional()
});

export const JogoEstatisticasSchema = z.object({
  posse_bola_casa: z.number().min(0).max(100),
  posse_bola_visitante: z.number().min(0).max(100),
  chutes_casa: z.number().min(0),
  chutes_visitante: z.number().min(0),
  chutes_gol_casa: z.number().min(0),
  chutes_gol_visitante: z.number().min(0),
  escanteios_casa: z.number().min(0),
  escanteios_visitante: z.number().min(0),
  faltas_casa: z.number().min(0),
  faltas_visitante: z.number().min(0),
  cartoes_amarelos_casa: z.number().min(0),
  cartoes_amarelos_visitante: z.number().min(0),
  cartoes_vermelhos_casa: z.number().min(0),
  cartoes_vermelhos_visitante: z.number().min(0)
});

export const JogoOddsSchema = z.object({
  vitoria_casa: z.number().min(1),
  empate: z.number().min(1),
  vitoria_visitante: z.number().min(1)
});

export const JogoTransmissaoSchema = z.object({
  tv: z.array(z.string()),
  streaming: z.array(z.string()),
  radio: z.array(z.string())
});

export const JogoSchema = z.object({
  _id: z.string().optional(),
  rodada: z.string().min(1, 'Rodada é obrigatória'),
  time_casa: z.string().min(2, 'Time da casa é obrigatório'),
  time_visitante: z.string().min(2, 'Time visitante é obrigatório'),
  data_hora: z.coerce.date(),
  estadio: z.string().optional(),
  cidade: z.string().optional(),
  campeonato: z.string().min(2, 'Campeonato é obrigatório'),
  temporada: z.string().min(4, 'Temporada é obrigatória'),
  status: z.enum(['agendado', 'ao_vivo', 'finalizado', 'adiado', 'cancelado']),
  resultado: JogoResultadoSchema.optional(),
  estatisticas: JogoEstatisticasSchema.optional(),
  odds: JogoOddsSchema.optional(),
  transmissao: JogoTransmissaoSchema.optional(),
  data_criacao: z.coerce.date(),
  data_atualizacao: z.coerce.date()
});

export const CreateJogoSchema = z.object({
  rodada: z.string().min(1, 'Rodada é obrigatória'),
  time_casa: z.string().min(2, 'Time da casa é obrigatório'),
  time_visitante: z.string().min(2, 'Time visitante é obrigatório'),
  data_hora: z.coerce.date(),
  estadio: z.string().optional(),
  cidade: z.string().optional(),
  campeonato: z.string().min(2, 'Campeonato é obrigatório'),
  temporada: z.string().min(4, 'Temporada é obrigatória')
});

export type Jogo = z.infer<typeof JogoSchema>;
export type CreateJogoDto = z.infer<typeof CreateJogoSchema>;
export type JogoResultado = z.infer<typeof JogoResultadoSchema>;
export type JogoEstatisticas = z.infer<typeof JogoEstatisticasSchema>;
export type JogoOdds = z.infer<typeof JogoOddsSchema>;
export type JogoTransmissao = z.infer<typeof JogoTransmissaoSchema>;
