import { z } from 'zod';

// Schemas para autenticação
export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const RegisterSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  data_nascimento: z.string().optional(),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  bairro: z.string().optional(),
});

// Tipos derivados
export type LoginData = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;

// Interface para resposta de autenticação (baseada no backend real)
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: UserProfile;
    message: string;
    access_token: string; // Token JWT
  };
  timestamp: string;
  path: string;
  statusCode: number;
}

// Interface alternativa para quando a resposta vem diretamente com user e access_token
export interface DirectAuthResponse {
  user: UserProfile;
  message: string;
  access_token: string;
}

// Interface legada para compatibilidade
export interface LegacyAuthResponse {
  user: UserProfile;
  message: string;
  access_token?: string; // Opcional, pois usa cookies httpOnly
}

// Interface para perfil do usuário (baseada no schema do backend)
export interface UserProfile {
  _id?: string;
  id?: string;
  nome: string;
  email: string;
  data_nascimento?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  bairro?: string;
  bairroId?: string;
  nivel?: number;
  isAdmin?: boolean;
  totalPontos?: number;
  totalMoedas?: number;
  totalVitorias?: number;
  totalDerrotas?: number;
  totalEmpates?: number;
  medalhas?: string[];
  assinaturaPremium?: {
    ativa: boolean;
    dataInicio?: Date;
    dataFim?: Date;
    tipo?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
