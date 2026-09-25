import { format, subHours } from 'date-fns';

/**
 * Chave do "dia de jogo" (yyyy-MM-dd). O dia só vira no horário configurado
 * (`dayStartHour`), então às 02:00 com virada às 04:00 ainda é o dia anterior.
 */
export function gameDayKey(now: Date, dayStartHour = 0): string {
  return format(subHours(now, dayStartHour), 'yyyy-MM-dd');
}
