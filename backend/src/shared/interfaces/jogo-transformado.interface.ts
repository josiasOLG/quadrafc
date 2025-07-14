import { StatusJogoAPI, StatusJogoBR } from '../enums/jogo-status.enum';

export interface JogoTransformado {
  codigoAPI: number;
  timeA: {
    nome: string;
    escudo: string;
  };
  timeB: {
    nome: string;
    escudo: string;
  };
  data: Date;
  campeonato: string;
  status: StatusJogoBR;
  statusOriginal: StatusJogoAPI;
  statusDetalhes: {
    podeAceitar: boolean;
    jogoFinalizado: boolean;
    descricao: string;
  };
  resultado?: {
    timeA: number;
    timeB: number;
  } | null;
}
