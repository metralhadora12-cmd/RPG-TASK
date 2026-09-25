import { addDays as addDaysFn, format, parseISO, subHours } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';
import { getLocale } from './i18n';

/**
 * Chave do "dia de jogo" (yyyy-MM-dd). O dia só vira no horário configurado
 * (`dayStartHour`), então às 02:00 com virada às 04:00 ainda é o dia anterior.
 */
export function gameDayKey(now: Date, dayStartHour = 0): string {
  return format(subHours(now, dayStartHour), 'yyyy-MM-dd');
}

/** Locale do date-fns correspondente ao idioma ativo. */
export function dateLocale() {
  return getLocale() === 'en' ? enUS : ptBR;
}

/** Soma dias a uma data yyyy-MM-dd. */
export function addDaysKey(day: string, amount: number): string {
  return format(addDaysFn(parseISO(day), amount), 'yyyy-MM-dd');
}

/** Formata uma data yyyy-MM-dd com um padrão do date-fns no idioma ativo. */
export function formatDay(day: string, pattern = "EEE, d 'de' MMM"): string {
  return format(parseISO(day), pattern, { locale: dateLocale() });
}

/** Dia local (yyyy-MM-dd) de um timestamp ISO. */
export function dayOf(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd');
}
