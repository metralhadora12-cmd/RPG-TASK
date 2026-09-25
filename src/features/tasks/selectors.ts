import { addDays, endOfWeek, format, parseISO } from 'date-fns';
import type { SortMode, Task } from '@/store/types';
import { difficultyRank, type SmartViewId } from './constants';
import { isDailyDue } from './dayCycle';

/** Identifica o que está sendo exibido: uma lista inteligente ou uma lista do usuário. */
export type ViewRef = { type: 'smart'; id: SmartViewId } | { type: 'list'; id: string };

export interface ViewContext {
  /** Dia de jogo atual (yyyy-MM-dd). */
  today: string;
}

export interface ViewTasks {
  open: Task[];
  done: Task[];
}

const isOpen = (task: Task) => !task.completedAt;
/** Hábitos têm tela própria; as listas do usuário mostram missões e rotinas. */
const isListable = (task: Task) => task.kind !== 'habit';
const isTodo = (task: Task) => task.kind === 'todo';

export function isInMyDay(task: Task, today: string): boolean {
  return task.myDayDate === today;
}

export function isOverdue(task: Task, today: string): boolean {
  return Boolean(task.dueDate && isOpen(task) && task.dueDate < today);
}

/** Tarefas de uma visão, separadas em pendentes e concluídas (sem ordenação). */
export function selectViewTasks(tasks: Task[], view: ViewRef, { today }: ViewContext): ViewTasks {
  let pool = tasks.filter(isTodo);
  let matches: (task: Task) => boolean;
  if (view.type === 'list') {
    pool = tasks.filter(isListable);
    matches = (task) => task.listId === view.id;
  } else {
    switch (view.id) {
      case 'my-day':
        // Missões marcadas para hoje + rotinas que valem hoje.
        pool = tasks.filter(isListable);
        matches = (task) => (task.kind === 'daily' ? isDailyDue(task, today) : isInMyDay(task, today));
        break;
      case 'dailies':
        pool = tasks.filter((t) => t.kind === 'daily');
        matches = () => true;
        break;
      case 'habits':
        return { open: tasks.filter((t) => t.kind === 'habit'), done: [] };
      case 'important':
        matches = (task) => task.important;
        break;
      case 'planned':
        matches = (task) => Boolean(task.dueDate) && isOpen(task);
        break;
      case 'all':
        matches = isOpen;
        break;
      case 'completed':
        matches = (task) => !isOpen(task);
        break;
    }
  }
  const selected = pool.filter(matches);
  return {
    open: selected.filter(isOpen),
    done: selected
      .filter((task) => !isOpen(task))
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
  };
}

export function countOpen(tasks: Task[], view: ViewRef, ctx: ViewContext): number {
  const { open, done } = selectViewTasks(tasks, view, ctx);
  if (view.type === 'smart' && view.id === 'completed') return done.length;
  // Rotinas: só as que ainda valem hoje.
  if (view.type === 'smart' && view.id === 'dailies') return open.filter((t) => isDailyDue(t, ctx.today)).length;
  if (view.type === 'smart' && view.id === 'habits') return 0;
  return open.length;
}

export type PlannedBucket = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'later';
export const plannedBuckets: PlannedBucket[] = ['overdue', 'today', 'tomorrow', 'thisWeek', 'later'];

/** Agrupa tarefas com data em Atrasadas / Hoje / Amanhã / Esta semana / Depois. */
export function groupPlanned(
  tasks: Task[],
  today: string,
  weekStartsOn: 0 | 1,
): Record<PlannedBucket, Task[]> {
  const todayDate = parseISO(today);
  const tomorrow = format(addDays(todayDate, 1), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(todayDate, { weekStartsOn }), 'yyyy-MM-dd');
  const groups: Record<PlannedBucket, Task[]> = { overdue: [], today: [], tomorrow: [], thisWeek: [], later: [] };
  for (const task of tasks) {
    const due = task.dueDate;
    if (!due) continue;
    if (due < today) groups.overdue.push(task);
    else if (due === today) groups.today.push(task);
    else if (due === tomorrow) groups.tomorrow.push(task);
    else if (due <= weekEnd) groups.thisWeek.push(task);
    else groups.later.push(task);
  }
  for (const bucket of plannedBuckets) groups[bucket] = sortTasks(groups[bucket], 'dueDate');
  return groups;
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/** Ordena sem mutar. Empates caem na ordem manual. */
export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const byOrder = (a: Task, b: Task) => a.order - b.order;
  const compare: Record<SortMode, (a: Task, b: Task) => number> = {
    manual: byOrder,
    dueDate: (a, b) => {
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      if (Boolean(a.dueDate) !== Boolean(b.dueDate)) return a.dueDate ? -1 : 1;
      return byOrder(a, b);
    },
    importance: (a, b) => Number(b.important) - Number(a.important) || byOrder(a, b),
    difficulty: (a, b) => difficultyRank[b.difficulty] - difficultyRank[a.difficulty] || byOrder(a, b),
    alpha: (a, b) => collator.compare(a.title, b.title) || byOrder(a, b),
  };
  return [...tasks].sort(compare[mode]);
}

/** Remove acentos e caixa para comparar texto. */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/**
 * Busca global em título, notas, passos e tags. Todas as palavras precisam
 * aparecer; palavras começando com `#` procuram só nas tags.
 */
export function searchTasks(tasks: Task[], query: string): Task[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return tasks.filter((task) => {
    const tags = task.tags.map(normalizeText);
    const haystack = normalizeText(
      [task.title, task.notes ?? '', ...task.subtasks.map((s) => s.title), ...task.tags].join(' '),
    );
    return terms.every((term) =>
      term.startsWith('#') && term.length > 1
        ? tags.some((tag) => tag.startsWith(term.slice(1)))
        : haystack.includes(term),
    );
  });
}

/**
 * Sugestões para o Meu Dia: pendentes fora do Meu Dia que estão atrasadas,
 * vencem hoje ou estavam no Meu Dia de dias anteriores.
 */
export function myDaySuggestions(tasks: Task[], today: string, limit = 8): Task[] {
  return sortTasks(
    tasks.filter(
      (task) =>
        isTodo(task) &&
        isOpen(task) &&
        !isInMyDay(task, today) &&
        ((task.dueDate !== undefined && task.dueDate <= today) ||
          (task.myDayDate !== undefined && task.myDayDate < today)),
    ),
    'dueDate',
  ).slice(0, limit);
}
