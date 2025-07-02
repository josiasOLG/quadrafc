import { z } from 'zod';

// Schema Zod para validação
export const UserCreateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  dataNascimento: z.string().optional(),
  genero: z.enum(['M', 'F', 'O']).optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  bairro: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  ativo: z.boolean().default(true),
});

export const UserUpdateSchema = UserCreateSchema.partial().extend({
  id: z.string().or(z.number()),
});

// Tipos TypeScript derivados dos schemas
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;

// Interface principal do usuário (compatível com backend)
export interface User {
  id?: string | number;
  _id?: string;
  nome: string;
  email: string;
  telefone?: string;
  dataNascimento?: Date | string;
  data_nascimento?: Date | string;
  genero?: 'M' | 'F' | 'O';
  cep?: string;
  cidade?: string;
  estado?: string;
  bairro?: string;
  bairroId?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  ativo: boolean;

  // Campos relacionados ao premium
  isPremium?: boolean;
  assinaturaPremium?: {
    ativa: boolean;
    dataInicio?: Date;
    dataFim?: Date;
    tipo?: string;
  };
  premiumStartDate?: Date | string;
  premiumEndDate?: Date | string;

  // Estatísticas do jogador
  totalPontos?: number;
  totalMoedas?: number;
  moedas?: number;
  pontuacaoTotal?: number;
  totalVitorias?: number;
  totalDerrotas?: number;
  totalEmpates?: number;
  medalhas?: string[];

  // Campos de nível/admin
  nivel?: number;
  isAdmin?: boolean;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para listagem de usuários
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

// Interface para filtros de busca
export interface UserFilters {
  nome?: string;
  email?: string;
  cidade?: string;
  bairro?: string;
  ativo?: boolean;
  assinaturaPremium?: boolean;
  page?: number;
  limit?: number;
}
