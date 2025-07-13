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
  pais?: string;
  bairro?: string;
  bairroId?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  ativo: boolean;

  // Avatar
  avatarUrl?: string;

  // Campos relacionados ao premium
  isPremium?: boolean;
  assinaturaPremium?: boolean;
  dataVencimentoPremium?: Date | string;
  premiumStartDate?: Date | string;
  premiumEndDate?: Date | string;

  // Estatísticas do jogador
  totalPoints?: number;
  totalPontos?: number;
  moedas?: number;
  totalMoedas?: number;
  pontuacaoTotal?: number;
  totalVitorias?: number;
  totalDerrotas?: number;
  totalEmpates?: number;
  medals?: string[];
  medalhas?: string[];

  // Campos administrativos
  isAdmin?: boolean;
  roles?: string[];
  banned?: boolean;
  banReason?: string;
  lastLogin?: Date | string;

  // Timestamps
  createdAt?: Date | string;
  updatedAt?: Date | string;
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
  isAdmin?: boolean;
  banned?: boolean;
  page?: number;
  limit?: number;
}

// Interface para dados de palpites do usuário
export interface UserPalpite {
  _id: string;
  jogo: {
    _id: string;
    timeCasa: string;
    timeVisitante: string;
    dataJogo: Date | string;
    campeonato: string;
    rodada?: number;
    placarCasa?: number;
    placarVisitante?: number;
    status: 'agendado' | 'ao_vivo' | 'finalizado' | 'adiado';
  };
  palpite: {
    placarCasa: number;
    placarVisitante: number;
    vencedor?: 'casa' | 'visitante' | 'empate';
  };
  pontos?: number;
  acertou?: boolean;
  status: 'pendente' | 'acertou' | 'errou';
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Interface para ranking do usuário
export interface UserRanking {
  posicao: number;
  tipo: 'bairro' | 'cidade' | 'estado' | 'nacional';
  totalUsuarios: number;
  pontos: number;
  percentil?: number;
  proximaPosicao?: {
    posicao: number;
    pontosNecessarios: number;
  };
}

// Interface para transações do usuário
export interface UserTransacao {
  _id: string;
  tipo: 'ganho' | 'gasto' | 'bonus' | 'premium' | 'ajuste';
  valor: number;
  saldoAnterior: number;
  saldoAtual: number;
  descricao: string;
  origem?: string;
  createdAt: Date | string;
}

// Interface para conquistas do usuário
export interface UserConquista {
  _id: string;
  tipo: string;
  nome: string;
  descricao: string;
  icone: string;
  nivel?: number;
  conquistadaEm: Date | string;
  progresso?: {
    atual: number;
    total: number;
  };
}

// Interface para logs de atividade
export interface UserActivityLog {
  _id: string;
  acao: string;
  detalhes: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date | string;
}

// Interface para estatísticas detalhadas
export interface UserStats {
  totalPalpites: number;
  palpitesAcertados: number;
  taxaAcerto: number;
  sequenciaAtual: number;
  melhorSequencia: number;
  pontosGanhos: number;
  pontosPerdidos: number;
  campeonatosParticipados: string[];
  medalhas: UserConquista[];
}
