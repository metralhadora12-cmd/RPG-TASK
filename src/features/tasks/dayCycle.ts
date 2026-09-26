import { addDaysKey, dayOf, gameDayKey } from '@/lib/date';
import type { Difficulty, Recurrence, Task } from '@/store/types';
import { isDueOn } from './recurrence';

export const DEFAULT_DAILY_RULE: Recurrence = { type: 'daily' };
/** Limite de dias verificados numa virada (ex.: voltar de férias longas). */
const MAX_GAP_DAYS = 60;

/** Dia de início de uma rotina (referência para a recorrência). */
export function dailyAnchor(task: Task): string {
  return task.dueDate ?? dayOf(task.createdAt);
}

export function isDailyDue(task: Task, day: string): boolean {
  return isDueOn(task.recurrence ?? DEFAULT_DAILY_RULE, dailyAnchor(task), day);
}

/** Dia de jogo em que a tarefa foi concluída. */
export function completedDay(task: Task, dayStartHour: number): string | undefined {
  return task.completedAt ? gameDayKey(new Date(task.completedAt), dayStartHour) : undefined;
}

export interface MissedDaily {
  taskId: string;
  title: string;
  difficulty: Difficulty;
}

export interface RolloverResult {
  tasks: Task[];
  missed: MissedDaily[];
  completed: { taskId: string; title: string }[];
  streaksLost: { taskId: string; title: string; streak: number }[];
}

/**
 * Fecha os dias de `lastDay` até ontem.
 * - Rotina que valia em algum desses dias e não foi feita nele: "perdida"
 *   (dano uma única vez, como no Habitica, e a sequência zera).
 * - Rotinas concluídas em dias anteriores voltam a ficar pendentes, com os passos desmarcados.
 * - Contadores de hábitos de dias anteriores zeram.
 */
export function rolloverDailies(tasks: Task[], lastDay: string, today: string, dayStartHour: number): RolloverResult {
  const days: string[] = [];
  for (let d = lastDay; d < today && days.length < MAX_GAP_DAYS; d = addDaysKey(d, 1)) days.push(d);
  const result: RolloverResult = { tasks: [], missed: [], completed: [], streaksLost: [] };

  for (const task of tasks) {
    if (task.kind === 'habit') {
      result.tasks.push(
        task.habitCounts && task.habitCounts.date < today ? { ...task, habitCounts: { up: 0, down: 0, date: today } } : task,
      );
      continue;
    }
    if (task.kind !== 'daily') {
      result.tasks.push(task);
      continue;
    }
    const doneOn = completedDay(task, dayStartHour);
    const missedAny = days.some((d) => isDailyDue(task, d) && doneOn !== d);
    if (doneOn && doneOn >= lastDay && doneOn < today) result.completed.push({ taskId: task.id, title: task.title });
    let next = task;
    if (missedAny) {
      result.missed.push({ taskId: task.id, title: task.title, difficulty: task.difficulty });
      if (task.streak > 0) result.streaksLost.push({ taskId: task.id, title: task.title, streak: task.streak });
      next = { ...next, streak: 0 };
    }
    if (doneOn && doneOn < today) {
      next = {
        ...next,
        completedAt: undefined,
        subtasks: next.subtasks.map((s) => ({ ...s, done: false })),
      };
    }
    result.tasks.push(next);
  }
  return result;
}
