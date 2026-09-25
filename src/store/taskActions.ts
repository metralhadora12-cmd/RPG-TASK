import { INBOX_LIST_ID } from '@/features/tasks/constants';
import { nextOccurrence, shiftDateTime } from '@/features/tasks/recurrence';
import { gameDayKey } from '@/lib/date';
import { createId } from '@/lib/id';
import type { Difficulty, Subtask, Task, TaskKind } from './types';
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
}

export interface TaskActions {
  addTask: (input: NewTaskInput) => string;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => Task | undefined;
  restoreTask: (task: Task) => void;
  completeTask: (id: string) => CompleteResult;
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

    completeTask: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task || task.completedAt) return {};
      const now = new Date().toISOString();
      const result: CompleteResult = {};
      let spawned: Task | undefined;
      if (task.recurrence && task.kind === 'todo') {
        const day = today(get);
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
      set((s) => ({
        tasks: [
          ...s.tasks.map((t) => (t.id === id ? { ...t, completedAt: now, updatedAt: now } : t)),
          ...(spawned ? [spawned] : []),
        ],
      }));
      return result;
    },

    uncompleteTask: (id) => patchTask(id, () => ({ completedAt: undefined })),

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
