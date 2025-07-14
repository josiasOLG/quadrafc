export enum StatusJogoAPI {
  SCHEDULED = 'SCHEDULED',
  TIMED = 'TIMED',
  IN_PLAY = 'IN_PLAY',
  PAUSED = 'PAUSED',
  EXTRA_TIME = 'EXTRA_TIME',
  PENALTY_SHOOTOUT = 'PENALTY_SHOOTOUT',
  FINISHED = 'FINISHED',
  SUSPENDED = 'SUSPENDED',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED',
  AWARDED = 'AWARDED',
}

export enum StatusJogoBR {
  AGENDADO = 'agendado',
  CONFIRMADO = 'confirmado',
  EM_ANDAMENTO = 'em_andamento',
  PAUSADO = 'pausado',
  PRORROGACAO = 'prorrogacao',
  PENALTIS = 'penaltis',
  ENCERRADO = 'encerrado',
  SUSPENSO = 'suspenso',
  ADIADO = 'adiado',
  CANCELADO = 'cancelado',
  DECLARADO = 'declarado',
}

export const STATUS_MAPPING: Record<StatusJogoAPI, StatusJogoBR> = {
  [StatusJogoAPI.SCHEDULED]: StatusJogoBR.AGENDADO,
  [StatusJogoAPI.TIMED]: StatusJogoBR.CONFIRMADO,
  [StatusJogoAPI.IN_PLAY]: StatusJogoBR.EM_ANDAMENTO,
  [StatusJogoAPI.PAUSED]: StatusJogoBR.PAUSADO,
  [StatusJogoAPI.EXTRA_TIME]: StatusJogoBR.PRORROGACAO,
  [StatusJogoAPI.PENALTY_SHOOTOUT]: StatusJogoBR.PENALTIS,
  [StatusJogoAPI.FINISHED]: StatusJogoBR.ENCERRADO,
  [StatusJogoAPI.SUSPENDED]: StatusJogoBR.SUSPENSO,
  [StatusJogoAPI.POSTPONED]: StatusJogoBR.ADIADO,
  [StatusJogoAPI.CANCELLED]: StatusJogoBR.CANCELADO,
  [StatusJogoAPI.AWARDED]: StatusJogoBR.DECLARADO,
};

export interface StatusJogoDetalhes {
  original: StatusJogoAPI;
  traduzido: StatusJogoBR;
  descricao: string;
  podeAceitar: boolean;
  jogoFinalizado: boolean;
}

export const STATUS_DETALHES: Record<StatusJogoAPI, StatusJogoDetalhes> = {
  [StatusJogoAPI.SCHEDULED]: {
    original: StatusJogoAPI.SCHEDULED,
    traduzido: StatusJogoBR.AGENDADO,
    descricao: 'Jogo agendado para uma data futura',
    podeAceitar: true,
    jogoFinalizado: false,
  },
  [StatusJogoAPI.TIMED]: {
    original: StatusJogoAPI.TIMED,
    traduzido: StatusJogoBR.CONFIRMADO,
    descricao: 'Jogo confirmado com horário definido',
    podeAceitar: true,
    jogoFinalizado: false,
  },
  [StatusJogoAPI.IN_PLAY]: {
    original: StatusJogoAPI.IN_PLAY,
    traduzido: StatusJogoBR.EM_ANDAMENTO,
    descricao: 'Jogo em andamento',
    podeAceitar: false,
    jogoFinalizado: false,
  },
  [StatusJogoAPI.PAUSED]: {
    original: StatusJogoAPI.PAUSED,
    traduzido: StatusJogoBR.PAUSADO,
    descricao: 'Jogo pausado temporariamente',
    podeAceitar: false,
    jogoFinalizado: false,
  },
  [StatusJogoAPI.EXTRA_TIME]: {
    original: StatusJogoAPI.EXTRA_TIME,
    traduzido: StatusJogoBR.PRORROGACAO,
    descricao: 'Jogo em prorrogação',
    podeAceitar: false,
    jogoFinalizado: false,
  },
  [StatusJogoAPI.PENALTY_SHOOTOUT]: {
    original: StatusJogoAPI.PENALTY_SHOOTOUT,
    traduzido: StatusJogoBR.PENALTIS,
    descricao: 'Jogo em disputa de pênaltis',
    podeAceitar: false,
    jogoFinalizado: false,
  },
  [StatusJogoAPI.FINISHED]: {
    original: StatusJogoAPI.FINISHED,
    traduzido: StatusJogoBR.ENCERRADO,
    descricao: 'Jogo finalizado com resultado oficial',
    podeAceitar: false,
    jogoFinalizado: true,
  },
  [StatusJogoAPI.SUSPENDED]: {
    original: StatusJogoAPI.SUSPENDED,
    traduzido: StatusJogoBR.SUSPENSO,
    descricao: 'Jogo suspenso pela arbitragem',
    podeAceitar: false,
    jogoFinalizado: false,
  },
  [StatusJogoAPI.POSTPONED]: {
    original: StatusJogoAPI.POSTPONED,
    traduzido: StatusJogoBR.ADIADO,
    descricao: 'Jogo adiado para nova data',
    podeAceitar: false,
    jogoFinalizado: false,
  },
  [StatusJogoAPI.CANCELLED]: {
    original: StatusJogoAPI.CANCELLED,
    traduzido: StatusJogoBR.CANCELADO,
    descricao: 'Jogo cancelado definitivamente',
    podeAceitar: false,
    jogoFinalizado: true,
  },
  [StatusJogoAPI.AWARDED]: {
    original: StatusJogoAPI.AWARDED,
    traduzido: StatusJogoBR.DECLARADO,
    descricao: 'Resultado declarado oficialmente (W.O.)',
    podeAceitar: false,
    jogoFinalizado: true,
  },
};

export function traduzirStatusJogo(statusAPI: string): StatusJogoBR {
  const status = statusAPI as StatusJogoAPI;
  return STATUS_MAPPING[status] || StatusJogoBR.AGENDADO;
}

export function obterDetalhesStatus(statusAPI: string): StatusJogoDetalhes {
  const status = statusAPI as StatusJogoAPI;
  return STATUS_DETALHES[status] || STATUS_DETALHES[StatusJogoAPI.SCHEDULED];
}

export function isStatusValido(status: string): boolean {
  return Object.values(StatusJogoAPI).includes(status as StatusJogoAPI);
}

export function isJogoFinalizado(statusAPI: string): boolean {
  const detalhes = obterDetalhesStatus(statusAPI);
  return detalhes.jogoFinalizado;
}

export function podeAceitarPalpites(statusAPI: string): boolean {
  const detalhes = obterDetalhesStatus(statusAPI);
  return detalhes.podeAceitar;
}

export function isStatusAberto(statusBR: string): boolean {
  const statusesAbertos = [StatusJogoBR.AGENDADO, StatusJogoBR.CONFIRMADO];
  return statusesAbertos.includes(statusBR as StatusJogoBR);
}

export function isStatusEncerrado(statusBR: string): boolean {
  const statusesEncerrados = [
    StatusJogoBR.ENCERRADO,
    StatusJogoBR.CANCELADO,
    StatusJogoBR.DECLARADO,
  ];
  return statusesEncerrados.includes(statusBR as StatusJogoBR);
}
