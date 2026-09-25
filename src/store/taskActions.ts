import { INBOX_LIST_ID } from '@/features/tasks/constants';
import { nextOccurrence, shiftDateTime } from '@/features/tasks/recurrence';
import { removeAllocated } from '@/features/character/stats';
import { applyReward, computeReward, POINTS_PER_LEVEL, revertReward, type ProgressState } from '@/features/progression/formulas';
import { classBaseStats } from '@/sprites/characterParts';
import { gameDayKey } from '@/lib/date';
import { createId } from '@/lib/id';
import type { Character, Difficulty, RewardEvent, Subtask, Task, TaskKind } from './types';
import type { GameState, StoreGet, StoreSet } from './useGameStore';

export interface NewTaskInput {
  title: string;
  listId?: string;
  kind?: TaskKind;
  difficulty?: Difficulty;
  important?: boolean;
  myDay?: boolean;
  dueDate?: string;
}

export interface CompleteResult {
  /** Id da próxima ocorrência criada por uma tarefa recorrente. */
  spawnedId?: string;
  spawnedDueDate?: string;
  /** Recompensa aplicada (ausente se a tarefa não existia ou já estava concluída). */
  reward?: {
    eventId: string;
    xp: number;
    gold: number;
    critical: boolean;
    levelsGained: number;
    fromLevel: number;
    toLevel: number;
    pointsGained: number;
  };
}

export interface CompleteOptions {
  /** Gerador aleatório (injete nos testes). */
  random?: () => number;
}

/** Mantém o log de recompensas com tamanho limitado. */
export const REWARD_LOG_LIMIT = 500;

export interface TaskActions {
  addTask: (input: NewTaskInput) => string;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => Task | undefined;
  restoreTask: (task: Task) => void;
  /** Conclui e aplica XP/Gold (com level up). */
  completeTask: (id: string, options?: CompleteOptions) => CompleteResult;
  /** Reabre e estorna a recompensa da conclusão (e remove a próxima ocorrência ainda pendente). */
  uncompleteTask: (id: string) => void;
  toggleImportant: (id: string) => void;
  toggleMyDay: (id: string) => void;
  moveTask: (id: string, listId: string) => void;
  /** Reordena as tarefas dadas (na ordem nova), preservando as posições das demais. */
  reorderTasks: (orderedIds: string[]) => void;
  addSubtask: (taskId: string, title: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, patch: Partial<Omit<Subtask, 'id'>>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
}

/** Estorna um evento de recompensa no personagem, inclusive pontos já distribuídos. */
export function revertOnCharacter(c: Character, event: RewardEvent): Character {
  const reverted = revertReward(progressOf(c), {
    xp: event.xp,
    gold: event.gold,
    levelsGained: event.levelsGained ?? 0,
    hpHealed: event.hpHealed ?? 0,
    mpHealed: event.mpHealed ?? 0,
    pointsGained: event.pointsGained ?? 0,
  });
  const pointsLost = (c.level - reverted.level) * POINTS_PER_LEVEL;
  const shortfall = Math.max(0, pointsLost - c.unspentPoints);
  return {
    ...c,
    ...reverted,
    stats: shortfall > 0 ? removeAllocated(c.stats, classBaseStats[c.classId], shortfall) : c.stats,
  };
}

export function progressOf(c: Character): ProgressState {
  return { level: c.level, xp: c.xp, hp: c.hp, mp: c.mp, gold: c.gold, unspentPoints: c.unspentPoints };
}

export function today(get: StoreGet): string {
  return gameDayKey(new Date(), get().settings.dayStartHour);
}

export function createTaskActions(set: StoreSet, get: StoreGet): TaskActions {
  const patchTask = (id: string, fn: (task: Task) => Partial<Task>) =>
    set((s) => ({
      tasks: s.tasks.map((task) =>
        task.id === id ? { ...task, ...fn(task), updatedAt: new Date().toISOString() } : task,
      ),
    }));

  return {
    addTask: (input) => {
      const now = new Date().toISOString();
      const id = createId();
      set((s: GameState) => {
        const listId = s.lists.some((l) => l.id === input.listId) ? input.listId! : INBOX_LIST_ID;
        // Novas tarefas entram no topo, como no Microsoft To Do.
        const minOrder = s.tasks.reduce((min, t) => Math.min(min, t.order), 0);
        const task: Task = {
          id,
          listId,
          kind: input.kind ?? 'todo',
          recurrence: input.kind === 'daily' ? { type: 'daily' } : undefined,
          habitDirection: input.kind === 'habit' ? 'both' : undefined,
          title: input.title.trim(),
          difficulty: input.difficulty ?? 'easy',
          important: input.important ?? false,
          myDayDate: input.myDay ? today(get) : undefined,
          dueDate: input.dueDate,
          subtasks: [],
          tags: [],
          streak: 0,
          order: minOrder - 1,
          createdAt: now,
          updatedAt: now,
        };
        return { tasks: [...s.tasks, task] };
      });
      return id;
    },

    updateTask: (id, patch) => patchTask(id, () => patch),

    deleteTask: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (task) set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      return task;
    },

    restoreTask: (task) =>
      set((s) => {
        const listExists = s.lists.some((l) => l.id === task.listId);
        const restored = listExists ? task : { ...task, listId: INBOX_LIST_ID };
        return { tasks: [...s.tasks.filter((t) => t.id !== task.id), restored] };
      }),

    completeTask: (id, options = {}) => {
      const state = get();
      const task = state.tasks.find((t) => t.id === id);
      if (!task || task.completedAt) return {};
      const now = new Date().toISOString();
      const day = today(get);
      const result: CompleteResult = {};

      let spawned: Task | undefined;
      if (task.recurrence && task.kind === 'todo') {
        const fromDue = task.dueDate ?? day;
        const nextDue = nextOccurrence(fromDue, task.recurrence, day);
        spawned = {
          ...task,
          id: createId(),
          dueDate: nextDue,
          reminderAt: task.reminderAt ? shiftDateTime(task.reminderAt, fromDue, nextDue) : undefined,
          reminderFiredAt: undefined,
          myDayDate: undefined,
          completedAt: undefined,
          subtasks: task.subtasks.map((st) => ({ ...st, id: createId(), done: false })),
          createdAt: now,
          updatedAt: now,
        };
        result.spawnedId = spawned.id;
        result.spawnedDueDate = nextDue;
      }

      const character = state.character;
      const reward = computeReward({
        difficulty: task.difficulty,
        subtasksDone: task.subtasks.filter((st) => st.done).length,
        onTime: task.kind === 'todo' && Boolean(task.dueDate && day <= task.dueDate),
        streak: task.kind === 'daily' ? task.streak : 0,
        classId: character.classId,
        random: options.random ?? Math.random,
      });
      const applied = applyReward(progressOf(character), reward.xp, reward.gold);
      const event: RewardEvent = {
        id: createId(),
        taskId: id,
        kind: 'complete',
        xp: applied.delta.xp,
        gold: applied.delta.gold,
        hp: applied.delta.hpHealed,
        at: now,
        critical: reward.critical,
        levelsGained: applied.delta.levelsGained,
        hpHealed: applied.delta.hpHealed,
        mpHealed: applied.delta.mpHealed,
        pointsGained: applied.delta.pointsGained,
        spawnedTaskId: spawned?.id,
        streakBefore: task.kind === 'daily' ? task.streak : undefined,
      };
      const newStreak = task.kind === 'daily' ? task.streak + 1 : task.streak;
      result.reward = {
        eventId: event.id,
        xp: event.xp,
        gold: event.gold,
        critical: reward.critical,
        levelsGained: applied.delta.levelsGained,
        fromLevel: character.level,
        toLevel: applied.state.level,
        pointsGained: applied.delta.pointsGained,
      };

      set((s) => ({
        tasks: [
          ...s.tasks.map((t) => (t.id === id ? { ...t, completedAt: now, streak: newStreak, updatedAt: now } : t)),
          ...(spawned ? [spawned] : []),
        ],
        character: { ...s.character, ...applied.state },
        rewardLog: [...s.rewardLog, event].slice(-REWARD_LOG_LIMIT),
        lifetime: {
          ...s.lifetime,
          tasksCompleted: s.lifetime.tasksCompleted + 1,
          xpEarned: s.lifetime.xpEarned + event.xp,
          goldEarned: s.lifetime.goldEarned + event.gold,
          criticals: s.lifetime.criticals + (reward.critical ? 1 : 0),
          bestStreak: Math.max(s.lifetime.bestStreak, newStreak),
        },
      }));
      return result;
    },

    uncompleteTask: (id) => {
      const state = get();
      const task = state.tasks.find((t) => t.id === id);
      if (!task?.completedAt) return;
      const now = new Date().toISOString();
      const event = [...state.rewardLog].reverse().find((e) => e.kind === 'complete' && e.taskId === id && !e.revertedAt);
      const spawned = event?.spawnedTaskId ? state.tasks.find((t) => t.id === event.spawnedTaskId) : undefined;
      // A próxima ocorrência só some se ninguém mexeu nela ainda.
      const dropSpawned = spawned && !spawned.completedAt;
      set((s) => ({
        tasks: s.tasks
          .filter((t) => !(dropSpawned && t.id === spawned.id))
          .map((t) =>
            t.id === id
              ? { ...t, completedAt: undefined, streak: event?.streakBefore ?? t.streak, updatedAt: now }
              : t,
          ),
        ...(event
          ? {
              character: revertOnCharacter(s.character, event),
              rewardLog: s.rewardLog.map((e) => (e.id === event.id ? { ...e, revertedAt: now } : e)),
              lifetime: {
                ...s.lifetime,
                tasksCompleted: Math.max(0, s.lifetime.tasksCompleted - 1),
                xpEarned: Math.max(0, s.lifetime.xpEarned - event.xp),
                goldEarned: Math.max(0, s.lifetime.goldEarned - event.gold),
                criticals: Math.max(0, s.lifetime.criticals - (event.critical ? 1 : 0)),
              },
            }
          : {}),
      }));
    },

    toggleImportant: (id) => patchTask(id, (t) => ({ important: !t.important })),

    toggleMyDay: (id) => {
      const day = today(get);
      patchTask(id, (t) => ({ myDayDate: t.myDayDate === day ? undefined : day }));
    },

    moveTask: (id, listId) => {
      if (!get().lists.some((l) => l.id === listId)) return;
      patchTask(id, () => ({ listId }));
    },

    reorderTasks: (orderedIds) =>
      set((s) => {
        const slots = s.tasks
          .filter((t) => orderedIds.includes(t.id))
          .map((t) => t.order)
          .sort((a, b) => a - b);
        const newOrder = new Map(orderedIds.map((id, i) => [id, slots[i]!]));
        return {
          tasks: s.tasks.map((t) => (newOrder.has(t.id) ? { ...t, order: newOrder.get(t.id)! } : t)),
        };
      }),

    addSubtask: (taskId, title) => {
      const clean = title.trim();
      if (!clean) return;
      patchTask(taskId, (t) => ({ subtasks: [...t.subtasks, { id: createId(), title: clean, done: false }] }));
    },

    updateSubtask: (taskId, subtaskId, patch) =>
      patchTask(taskId, (t) => ({
        subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, ...patch } : st)),
      })),

    deleteSubtask: (taskId, subtaskId) =>
      patchTask(taskId, (t) => ({ subtasks: t.subtasks.filter((st) => st.id !== subtaskId) })),
  };
}
