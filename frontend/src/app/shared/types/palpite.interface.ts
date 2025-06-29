export interface Palpite {
  _id?: string;
  usuario: string;
  jogo: string;
  tipo_palpite: 'resultado' | 'placar_exato' | 'ambas_marcam' | 'total_gols' | 'primeiro_gol' | 'handicap';
  valor_palpite: any;
  odds: number;
  valor_aposta: number;
  data_palpite: Date;
  status: 'pendente' | 'ganhou' | 'perdeu' | 'cancelado' | 'empate';
  valor_ganho?: number;
  pontos_ganhos?: number;
  data_resultado?: Date;
  multiplicador?: number;
  bonus_aplicado?: {
    tipo: string;
    valor: number;
    motivo: string;
  };
}

export interface CreatePalpiteDto {
  jogo: string;
  tipo_palpite: 'resultado' | 'placar_exato' | 'ambas_marcam' | 'total_gols' | 'primeiro_gol' | 'handicap';
  valor_palpite: any;
  odds: number;
  valor_aposta: number;
}
