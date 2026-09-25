import { INBOX_LIST_ID, listColors } from '@/features/tasks/constants';
import { t } from '@/lib/i18n';
import { createId } from '@/lib/id';
import type { ListGroup, SortMode, Task, TaskList } from './types';
import type { StoreGet, StoreSet } from './useGameStore';

export interface ListActions {
  createList: (input?: Partial<Pick<TaskList, 'name' | 'icon' | 'color' | 'groupId'>>) => string;
  updateList: (id: string, patch: Partial<Omit<TaskList, 'id' | 'createdAt'>>) => void;
  /** Exclui a lista e suas tarefas; devolve o que foi removido (para desfazer). */
  deleteList: (id: string) => { list: TaskList; tasks: Task[] } | undefined;
  restoreList: (list: TaskList, tasks: Task[]) => void;
  reorderLists: (orderedIds: string[]) => void;
  createGroup: (name?: string) => string;
  updateGroup: (id: string, patch: Partial<Omit<ListGroup, 'id'>>) => void;
  /** Remove o grupo; as listas dele ficam sem grupo. */
  deleteGroup: (id: string) => void;
  setViewSort: (viewKey: string, mode: SortMode) => void;
}

export function inboxList(): TaskList {
  return {
    id: INBOX_LIST_ID,
    name: t('tasks.inbox'),
    icon: 'scroll',
    color: listColors[0]!,
    order: 0,
    createdAt: new Date(0).toISOString(),
  };
}

export function createListActions(set: StoreSet, get: StoreGet): ListActions {
  return {
    createList: (input = {}) => {
      const id = createId();
      set((s) => ({
        lists: [
          ...s.lists,
          {
            id,
            name: input.name?.trim() || t('lists.defaultName'),
            icon: input.icon ?? 'scroll',
            color: input.color ?? listColors[s.lists.length % listColors.length]!,
            groupId: input.groupId,
            order: s.lists.reduce((max, l) => Math.max(max, l.order), 0) + 1,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      return id;
    },

    updateList: (id, patch) =>
      set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),

    deleteList: (id) => {
      if (id === INBOX_LIST_ID) return undefined;
      const { lists, tasks } = get();
      const list = lists.find((l) => l.id === id);
      if (!list) return undefined;
      const removed = tasks.filter((task) => task.listId === id);
      set((s) => ({
        lists: s.lists.filter((l) => l.id !== id),
        tasks: s.tasks.filter((task) => task.listId !== id),
      }));
      return { list, tasks: removed };
    },

    restoreList: (list, tasks) =>
      set((s) => ({
        lists: [...s.lists.filter((l) => l.id !== list.id), list],
        tasks: [...s.tasks.filter((task) => !tasks.some((r) => r.id === task.id)), ...tasks],
      })),

    reorderLists: (orderedIds) =>
      set((s) => {
        const slots = s.lists
          .filter((l) => orderedIds.includes(l.id))
          .map((l) => l.order)
          .sort((a, b) => a - b);
        const newOrder = new Map(orderedIds.map((id, i) => [id, slots[i]!]));
        return { lists: s.lists.map((l) => (newOrder.has(l.id) ? { ...l, order: newOrder.get(l.id)! } : l)) };
      }),

    createGroup: (name) => {
      const id = createId();
      set((s) => ({
        groups: [
          ...s.groups,
          {
            id,
            name: name?.trim() || t('lists.defaultGroupName'),
            order: s.groups.reduce((max, g) => Math.max(max, g.order), 0) + 1,
            collapsed: false,
          },
        ],
      }));
      return id;
    },

    updateGroup: (id, patch) =>
      set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

    deleteGroup: (id) =>
      set((s) => ({
        groups: s.groups.filter((g) => g.id !== id),
        lists: s.lists.map((l) => (l.groupId === id ? { ...l, groupId: undefined } : l)),
      })),

    setViewSort: (viewKey, mode) => set((s) => ({ viewPrefs: { ...s.viewPrefs, [viewKey]: mode } })),
  };
}
