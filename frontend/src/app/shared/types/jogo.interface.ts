export interface Jogo {
  _id?: string;
  rodada: string;
  time_casa: string;
  time_visitante: string;
  data_hora: Date;
  estadio?: string;
  cidade?: string;
  campeonato: string;
  temporada: string;
  status: 'agendado' | 'ao_vivo' | 'finalizado' | 'adiado' | 'cancelado';
  resultado?: {
    gols_casa: number;
    gols_visitante: number;
    vencedor?: 'casa' | 'visitante' | 'empate';
  };
  estatisticas?: {
    posse_bola_casa: number;
    posse_bola_visitante: number;
    chutes_casa: number;
    chutes_visitante: number;
    chutes_gol_casa: number;
    chutes_gol_visitante: number;
    escanteios_casa: number;
    escanteios_visitante: number;
    faltas_casa: number;
    faltas_visitante: number;
    cartoes_amarelos_casa: number;
    cartoes_amarelos_visitante: number;
    cartoes_vermelhos_casa: number;
    cartoes_vermelhos_visitante: number;
  };
  odds?: {
    vitoria_casa: number;
    empate: number;
    vitoria_visitante: number;
  };
  transmissao?: {
    tv: string[];
    streaming: string[];
    radio: string[];
  };
  data_criacao: Date;
  data_atualizacao: Date;
}

export interface CreateJogoDto {
  rodada: string;
  time_casa: string;
  time_visitante: string;
  data_hora: Date;
  estadio?: string;
  cidade?: string;
  campeonato: string;
  temporada: string;
}
