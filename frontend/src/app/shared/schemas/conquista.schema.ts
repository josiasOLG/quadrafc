import { z } from 'zod';

export const ConquistaSchema = z.object({
  _id: z.string().optional(),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  categoria: z.enum(['palpites', 'sequencia', 'participacao', 'social', 'nivel']),
  tipo: z.enum(['bronze', 'prata', 'ouro', 'diamante']),
  icone: z.string().min(1, 'Ícone é obrigatório'),
  criterio: z.object({
    tipo: z.string(),
    valor: z.number().min(1),
    operador: z.enum(['>=', '>', '=', '<', '<='])
  }),
  pontos_recompensa: z.number().min(0),
  moedas_recompensa: z.number().min(0),
  data_criacao: z.coerce.date(),
  ativo: z.boolean()
});

export const ConquistaUsuarioSchema = z.object({
  _id: z.string().optional(),
  usuario: z.string(),
  conquista: ConquistaSchema,
  data_conquistada: z.coerce.date().optional(),
  progresso_atual: z.number().min(0),
  progresso_necessario: z.number().min(1),
  completada: z.boolean()
});

export const CreateConquistaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  categoria: z.enum(['palpites', 'sequencia', 'participacao', 'social', 'nivel']),
  tipo: z.enum(['bronze', 'prata', 'ouro', 'diamante']),
  icone: z.string().min(1, 'Ícone é obrigatório'),
  criterio: z.object({
    tipo: z.string(),
    valor: z.number().min(1),
    operador: z.enum(['>=', '>', '=', '<', '<='])
  }),
  pontos_recompensa: z.number().min(0),
  moedas_recompensa: z.number().min(0)
});

export type Conquista = z.infer<typeof ConquistaSchema>;
export type ConquistaUsuario = z.infer<typeof ConquistaUsuarioSchema>;
export type CreateConquistaDto = z.infer<typeof CreateConquistaSchema>;
