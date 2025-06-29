import { z } from 'zod';

export const BairroEstatisticasSchema = z.object({
  total_usuarios: z.number().min(0),
  usuarios_ativos: z.number().min(0),
  total_palpites: z.number().min(0),
  media_pontuacao: z.number().min(0),
  ranking_posicao: z.number().min(1)
});

export const CoordenadasSchema = z.object({
  latitude: z.number(),
  longitude: z.number()
});

export const BairroSchema = z.object({
  _id: z.string().optional(),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cidade: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  estado: z.string().min(2, 'Estado deve ter pelo menos 2 caracteres'),
  regiao: z.string().min(2, 'Região deve ter pelo menos 2 caracteres'),
  populacao: z.number().min(0).optional(),
  area_km2: z.number().min(0).optional(),
  densidade_demografica: z.number().min(0).optional(),
  codigo_postal: z.string().optional(),
  coordenadas: CoordenadasSchema.optional(),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  data_criacao: z.coerce.date(),
  estatisticas: BairroEstatisticasSchema
});

export const CreateBairroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cidade: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  estado: z.string().min(2, 'Estado deve ter pelo menos 2 caracteres'),
  regiao: z.string().min(2, 'Região deve ter pelo menos 2 caracteres'),
  populacao: z.number().min(0).optional(),
  area_km2: z.number().min(0).optional(),
  densidade_demografica: z.number().min(0).optional(),
  codigo_postal: z.string().optional(),
  coordenadas: CoordenadasSchema.optional(),
  descricao: z.string().optional()
});

export type Bairro = z.infer<typeof BairroSchema>;
export type CreateBairroDto = z.infer<typeof CreateBairroSchema>;
export type BairroEstatisticas = z.infer<typeof BairroEstatisticasSchema>;
export type Coordenadas = z.infer<typeof CoordenadasSchema>;
