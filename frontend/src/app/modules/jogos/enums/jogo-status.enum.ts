export enum JogoStatus {
  ABERTO = 'aberto',
  ENCERRADO = 'encerrado',
  AGENDADO = 'agendado',
  CONFIRMADO = 'confirmado',
  EM_ANDAMENTO = 'em_andamento',
  PAUSADO = 'pausado',
  PRORROGACAO = 'prorrogacao',
  PENALTIS = 'penaltis',
  SUSPENSO = 'suspenso',
  ADIADO = 'adiado',
  CANCELADO = 'cancelado',
  DECLARADO = 'declarado',
}

export const JOGO_STATUS_LABELS: Record<JogoStatus, string> = {
  [JogoStatus.ABERTO]: 'Aberto',
  [JogoStatus.ENCERRADO]: 'Finalizado',
  [JogoStatus.AGENDADO]: 'Agendado',
  [JogoStatus.CONFIRMADO]: 'Confirmado',
  [JogoStatus.EM_ANDAMENTO]: 'Em andamento',
  [JogoStatus.PAUSADO]: 'Pausado',
  [JogoStatus.PRORROGACAO]: 'Prorrogação',
  [JogoStatus.PENALTIS]: 'Pênaltis',
  [JogoStatus.SUSPENSO]: 'Suspenso',
  [JogoStatus.ADIADO]: 'Adiado',
  [JogoStatus.CANCELADO]: 'Cancelado',
  [JogoStatus.DECLARADO]: 'Declarado',
};

export const JOGO_STATUS_CORES: Record<JogoStatus, string> = {
  [JogoStatus.ABERTO]: 'success',
  [JogoStatus.ENCERRADO]: 'info',
  [JogoStatus.AGENDADO]: 'primary',
  [JogoStatus.CONFIRMADO]: 'primary',
  [JogoStatus.EM_ANDAMENTO]: 'warning',
  [JogoStatus.PAUSADO]: 'warning',
  [JogoStatus.PRORROGACAO]: 'warning',
  [JogoStatus.PENALTIS]: 'warning',
  [JogoStatus.SUSPENSO]: 'secondary',
  [JogoStatus.ADIADO]: 'danger',
  [JogoStatus.CANCELADO]: 'danger',
  [JogoStatus.DECLARADO]: 'info',
};
