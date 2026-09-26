import type { Task } from '@/store/types';

let seq = 0;

/** Cria uma tarefa de teste com valores padrão. */
export function makeTask(overrides: Partial<Task> = {}): Task {
  seq += 1;
  return {
    id: `t${seq}`,
    listId: 'inbox',
    kind: 'todo',
    title: `Tarefa ${seq}`,
    difficulty: 'easy',
    important: false,
    subtasks: [],
    tags: [],
    streak: 0,
    order: seq,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}
