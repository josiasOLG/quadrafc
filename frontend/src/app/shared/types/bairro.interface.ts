export interface Bairro {
  _id?: string;
  nome: string;
  cidade: string;
  estado: string;
  regiao: string;
  populacao?: number;
  area_km2?: number;
  densidade_demografica?: number;
  codigo_postal?: string;
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
  descricao?: string;
  ativo: boolean;
  data_criacao: Date;
  estatisticas: {
    total_usuarios: number;
    usuarios_ativos: number;
    total_palpites: number;
    media_pontuacao: number;
    ranking_posicao: number;
  };
}

export interface CreateBairroDto {
  nome: string;
  cidade: string;
  estado: string;
  regiao: string;
  populacao?: number;
  area_km2?: number;
  densidade_demografica?: number;
  codigo_postal?: string;
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
  descricao?: string;
}
