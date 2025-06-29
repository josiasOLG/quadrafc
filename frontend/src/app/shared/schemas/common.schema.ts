import { z } from 'zod';

export const PaginationParamsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional()
});

export const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1),
  total: z.number().min(0),
  totalPages: z.number().min(0)
});

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  pagination: PaginationSchema.optional(),
  errors: z.array(z.any()).optional()
});

export const RankingItemSchema = z.object({
  usuario: z.string(),
  nome: z.string(),
  bairro: z.string(),
  pontos: z.number().min(0),
  posicao: z.number().min(1),
  foto_perfil: z.string().optional()
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ApiResponse<T = any> = Omit<z.infer<typeof ApiResponseSchema>, 'data'> & { data?: T };
export type RankingItem = z.infer<typeof RankingItemSchema>;
