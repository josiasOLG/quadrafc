import { z } from 'zod';

export const UserConfiguracoesSchema = z.object({
  notificacoes_push: z.boolean(),
  notificacoes_email: z.boolean(),
  tema: z.enum(['claro', 'escuro', 'auto']),
  idioma: z.string().min(2),
});

export const UserEstatisticasSchema = z.object({
  palpites_totais: z.number().min(0),
  palpites_corretos: z.number().min(0),
  sequencia_atual: z.number().min(0),
  melhor_sequencia: z.number().min(0),
  jogos_favoritos: z.array(z.string()),
});

export const UserSchema = z.object({
  _id: z.string().optional(),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().optional(),
  data_nascimento: z.coerce.date(),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  pais: z.string().optional(),
  cep: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  moedas: z.number().min(0),
  pontos: z.number().min(0), // Para compatibilidade com alguns templates
  pontos_totais: z.number().min(0),
  totalPoints: z.number().min(0).optional(), // Para compatibilidade com backend
  nivel: z.number().min(1),
  foto_perfil: z.string().optional(),
  avatarUrl: z.string().optional(), // Para compatibilidade com backend
  data_cadastro: z.coerce.date(),
  data_criacao: z.coerce.date().optional(), // Para compatibilidade com alguns templates
  ultimo_login: z.coerce.date().optional(),
  ativo: z.boolean(),
  verificado: z.boolean(),
  emailVerificado: z.boolean().optional().default(false),
  isPublicProfile: z.boolean().optional().default(true),
  configuracoes: UserConfiguracoesSchema.optional(),
  estatisticas: UserEstatisticasSchema.optional(),
});

export const CreateUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  data_nascimento: z.coerce.date().optional(), // Opcional no registro, obrigatório no onboarding
  telefone: z.string().optional(),
  bairro: z.string().optional(), // Opcional no registro, obrigatório no onboarding
});

// Schema específico para registro (apenas campos essenciais)
export const RegisterUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
