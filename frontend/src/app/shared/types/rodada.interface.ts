export interface Rodada {
  _id?: string;
  numero: number;
  campeonato: string;
  temporada: string;
  data_inicio: Date;
  data_fim: Date;
  status: 'agendada' | 'em_andamento' | 'finalizada';
  jogos: string[];
  premiacao: {
    primeiro_lugar: number;
    segundo_lugar: number;
    terceiro_lugar: number;
    participacao: number;
  };
  estatisticas: {
    total_palpites: number;
    total_apostadores: number;
    valor_total_apostado: number;
    maior_premio: number;
    palpite_mais_comum: string;
  };
  data_criacao: Date;
}

export interface CreateRodadaDto {
  numero: number;
  campeonato: string;
  temporada: string;
  data_inicio: Date;
  data_fim: Date;
}
