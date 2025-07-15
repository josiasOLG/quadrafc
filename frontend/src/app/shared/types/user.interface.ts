export interface User {
  _id?: string;
  nome: string;
  email: string;
  password?: string;
  data_nascimento: Date;
  telefone?: string;
  bairro: string;
  moedas: number;
  pontos_totais: number;
  nivel: number;
  foto_perfil?: string;
  data_cadastro: Date;
  ultimo_login?: Date;
  ativo: boolean;
  verificado: boolean;
  emailVerificado: boolean;
  isPublicProfile: boolean;
  configuracoes: {
    notificacoes_push: boolean;
    notificacoes_email: boolean;
    tema: 'claro' | 'escuro' | 'auto';
    idioma: string;
  };
  estatisticas: {
    palpites_totais: number;
    palpites_corretos: number;
    sequencia_atual: number;
    melhor_sequencia: number;
    jogos_favoritos: string[];
  };
}

export interface CreateUserDto {
  nome: string;
  email: string;
  password: string;
  data_nascimento: Date;
  telefone?: string;
  bairro: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token?: string;
}
