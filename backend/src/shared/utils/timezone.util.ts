import { format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const TIMEZONE_BRASIL = 'America/Sao_Paulo';

export function converterUTCParaBrasil(dataUTC: string | Date): string {
  const data = typeof dataUTC === 'string' ? new Date(dataUTC) : dataUTC;
  const dataZonada = toZonedTime(data, TIMEZONE_BRASIL);
  return format(dataZonada, 'yyyy-MM-dd HH:mm:ss');
}

export function converterBrasilParaUTC(dataBrasil: string | Date): Date {
  const data = typeof dataBrasil === 'string' ? new Date(dataBrasil) : dataBrasil;
  return fromZonedTime(data, TIMEZONE_BRASIL);
}

export function formatarDataBrasil(
  data: string | Date,
  formato: string = 'dd/MM/yyyy HH:mm'
): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  const dataZonada = toZonedTime(dataObj, TIMEZONE_BRASIL);
  return format(dataZonada, formato);
}

export function obterDataAtualBrasil(): string {
  const agora = new Date();
  const dataZonada = toZonedTime(agora, TIMEZONE_BRASIL);
  return format(dataZonada, 'yyyy-MM-dd');
}

export function obterHorarioBrasil(): Date {
  const agora = new Date();
  return toZonedTime(agora, TIMEZONE_BRASIL);
}

export function verificarHorarioComercial(data?: Date): boolean {
  const agora = data || new Date();
  const horaBrasil = toZonedTime(agora, TIMEZONE_BRASIL);
  const hora = horaBrasil.getHours();
  const diaSemana = horaBrasil.getDay();

  return diaSemana >= 1 && diaSemana <= 5 && hora >= 8 && hora <= 18;
}

export function preservarDataOriginalAPI(dataUTC: string | Date): string {
  if (typeof dataUTC === 'string') {
    return dataUTC;
  }
  return dataUTC.toISOString();
}

export function formatarDataOriginalAPI(dataUTC: string | Date): string {
  const data = typeof dataUTC === 'string' ? new Date(dataUTC) : dataUTC;
  return format(data, 'yyyy-MM-dd HH:mm:ss');
}

export function obterTimestampBrasil(): number {
  return fromZonedTime(new Date(), TIMEZONE_BRASIL).getTime();
}
