import { z } from 'zod';

// Schema Zod para validação de Jogo
export const JogoCreateSchema = z.object({
  timeA: z.object({
    nome: z.string().min(2, 'Nome do time mandante é obrigatório'),
    escudo: z.string().optional().default(''),
  }),
  timeB: z.object({
    nome: z.string().min(2, 'Nome do time visitante é obrigatório'),
    escudo: z.string().optional().default(''),
  }),
  data: z.string().refine((date) => !isNaN(Date.parse(date)), 'Data inválida'),
  campeonato: z.string().min(2, 'Campeonato é obrigatório'),
  rodada: z.number().min(1, 'Rodada deve ser maior que 0').optional(),
  estadio: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  resultado: z
    .object({
      timeA: z.number().min(0).optional(),
      timeB: z.number().min(0).optional(),
    })
    .optional(),
  status: z
    .enum(['aberto', 'encerrado', 'agendado', 'em_andamento', 'finalizado', 'adiado', 'cancelado'])
    .default('aberto'),
  observacoes: z.string().optional(),
});

export const JogoUpdateSchema = JogoCreateSchema.partial();

// Tipos TypeScript derivados dos schemas
export type JogoCreate = z.infer<typeof JogoCreateSchema>;
export type JogoUpdate = z.infer<typeof JogoUpdateSchema>;

// Interface para times (conforme backend)
export interface TimeInfo {
  nome: string;
  escudo: string;
}

// Interface para resultado
export interface Resultado {
  timeA: number | null;
  timeB: number | null;
}

// Interface principal do Jogo (compatível com backend real)
export interface Jogo {
  _id?: string;
  id?: number; // Para compatibilidade

  // Dados da API externa
  codigoAPI: number;

  // Times
  timeA: TimeInfo;
  timeB: TimeInfo;

  // Campos legados para compatibilidade
  timeMandante?: TimeInfo;
  timeVisitante?: TimeInfo;
  mandante?: string;
  visitante?: string;

  // Data e hora
  data: string | Date;
  dataHora?: string | Date; // Para compatibilidade

  // Resultado
  resultado?: Resultado;

  // Campos legados para resultado
  golsMandante?: number;
  golsVisitante?: number;

  // Informações do jogo
  campeonato: string;
  rodadaId?: string;
  rodada?: number; // Para compatibilidade

  // Status do jogo (backend usa diferentes valores)
  status:
    | 'aberto'
    | 'encerrado'
    | 'agendado'
    | 'em_andamento'
    | 'finalizado'
    | 'adiado'
    | 'cancelado';

  // Palpites
  palpites?: string[];
  totalPalpites?: number;
  permitePalpites?: boolean; // Para compatibilidade

  // Informações adicionais
  temporada?: string;
  estadio?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;

  // IDs externos (APIs de futebol)
  externalId?: string;
  apiSource?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para listagem de jogos
export interface JogoListResponse {
  data: Jogo[];
  total: number;
  page: number;
  limit: number;
}

// Interface para filtros de busca
export interface JogoFilters {
  mandante?: string;
  visitante?: string;
  campeonato?: string;
  rodada?: number;
  status?: string;
  dataInicio?: string | Date;
  dataFim?: string | Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
