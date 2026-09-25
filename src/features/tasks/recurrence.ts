import { addDays, addMonths, addYears, format, getDay, parseISO } from 'date-fns';
import { t } from '@/lib/i18n';
import type { Recurrence, Weekday } from '@/store/types';

const DAY = 'yyyy-MM-dd';

/** Um passo da recorrência a partir de `date` (yyyy-MM-dd). */
export function stepRecurrence(date: string, rule: Recurrence): string {
  const d = parseISO(date);
  switch (rule.type) {
    case 'daily':
      return format(addDays(d, 1), DAY);
    case 'weekdays': {
      let next = addDays(d, 1);
      while (getDay(next) === 0 || getDay(next) === 6) next = addDays(next, 1);
      return format(next, DAY);
    }
    case 'weekly': {
      if (rule.days.length === 0) return format(addDays(d, 7), DAY);
      let next = addDays(d, 1);
      while (!rule.days.includes(getDay(next) as Weekday)) next = addDays(next, 1);
      return format(next, DAY);
    }
    case 'monthly':
      return format(addMonths(d, 1), DAY);
    case 'yearly':
      return format(addYears(d, 1), DAY);
    case 'everyNDays':
      return format(addDays(d, Math.max(1, Math.floor(rule.interval))), DAY);
  }
}

/**
 * Próxima ocorrência depois de `dueDate`. Se a tarefa estava atrasada,
 * avança até cair em `today` ou depois (não cria cópias já vencidas).
 */
export function nextOccurrence(dueDate: string, rule: Recurrence, today: string): string {
  let next = stepRecurrence(dueDate, rule);
  for (let guard = 0; next < today && guard < 5000; guard++) {
    next = stepRecurrence(next, rule);
  }
  return next;
}

/** Desloca um "yyyy-MM-ddTHH:mm" pelo mesmo número de dias entre duas datas. */
export function shiftDateTime(dateTime: string, fromDay: string, toDay: string): string {
  const days = Math.round((parseISO(toDay).getTime() - parseISO(fromDay).getTime()) / 86_400_000);
  return format(addDays(parseISO(dateTime), days), "yyyy-MM-dd'T'HH:mm");
}

const weekdayKeys = ['tasks.weekday.0', 'tasks.weekday.1', 'tasks.weekday.2', 'tasks.weekday.3', 'tasks.weekday.4', 'tasks.weekday.5', 'tasks.weekday.6'] as const;

export function weekdayShort(day: Weekday): string {
  return t(weekdayKeys[day]);
}

/** Texto curto para a recorrência (ex.: "Semanal: seg, qua"). */
export function describeRecurrence(rule: Recurrence): string {
  switch (rule.type) {
    case 'daily':
      return t('tasks.recurrence.daily');
    case 'weekdays':
      return t('tasks.recurrence.weekdays');
    case 'weekly':
      return rule.days.length
        ? `${t('tasks.recurrence.weekly')}: ${[...rule.days].sort().map(weekdayShort).join(', ')}`
        : t('tasks.recurrence.weekly');
    case 'monthly':
      return t('tasks.recurrence.monthly');
    case 'yearly':
      return t('tasks.recurrence.yearly');
    case 'everyNDays':
      return t('tasks.recurrence.everyNDays.desc', { n: rule.interval });
  }
}
