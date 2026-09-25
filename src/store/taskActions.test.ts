import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialPersistedState, useGameStore } from './useGameStore';

const store = () => useGameStore.getState();
const task = (id: string) => store().tasks.find((t) => t.id === id)!;

describe('ações de tarefas', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // sexta, 25/09/2026
    useGameStore.setState(initialPersistedState());
  });
  afterEach(() => vi.useRealTimers());

  it('adiciona no topo, na lista padrão quando a lista não existe', () => {
    const a = store().addTask({ title: '  Primeira  ' });
    const b = store().addTask({ title: 'Segunda', listId: 'nao-existe', myDay: true });
    expect(task(a).title).toBe('Primeira');
    expect(task(b).listId).toBe('inbox');
    expect(task(b).order).toBeLessThan(task(a).order);
    expect(task(b).myDayDate).toBe('2026-09-25');
  });

  it('Meu Dia respeita o horário de virada do dia', () => {
    store().updateSettings({ dayStartHour: 12 });
    const id = store().addTask({ title: 'x' });
    store().toggleMyDay(id);
    expect(task(id).myDayDate).toBe('2026-09-24');
    store().toggleMyDay(id);
    expect(task(id).myDayDate).toBeUndefined();
  });

  it('concluir e reabrir', () => {
    const id = store().addTask({ title: 'x' });
    expect(store().completeTask(id)).toEqual({});
    expect(task(id).completedAt).toBeDefined();
    // Concluir de novo não faz nada.
    expect(store().completeTask(id)).toEqual({});
    store().uncompleteTask(id);
    expect(task(id).completedAt).toBeUndefined();
  });

  it('tarefa recorrente cria a próxima ocorrência com passos zerados e lembrete deslocado', () => {
    const id = store().addTask({ title: 'Treinar', dueDate: '2026-09-25' });
    store().updateTask(id, { recurrence: { type: 'weekdays' }, reminderAt: '2026-09-25T08:00' });
    store().addSubtask(id, 'Aquecer');
    store().updateSubtask(id, task(id).subtasks[0]!.id, { done: true });
    const { spawnedId, spawnedDueDate } = store().completeTask(id);
    expect(spawnedDueDate).toBe('2026-09-28');
    const next = task(spawnedId!);
    expect(next.completedAt).toBeUndefined();
    expect(next.dueDate).toBe('2026-09-28');
    expect(next.reminderAt).toBe('2026-09-28T08:00');
    expect(next.subtasks.map((s) => s.done)).toEqual([false]);
    expect(next.subtasks[0]!.id).not.toBe(task(id).subtasks[0]!.id);
  });

  it('excluir e restaurar', () => {
    const id = store().addTask({ title: 'x' });
    const removed = store().deleteTask(id)!;
    expect(store().tasks).toHaveLength(0);
    store().restoreTask(removed);
    expect(task(id).title).toBe('x');
  });

  it('reordena preservando as posições das tarefas fora da visão', () => {
    const ids = ['a', 'b', 'c', 'd'].map((title) => store().addTask({ title }));
    // Ordem atual (topo primeiro): d, c, b, a
    const [, b, , d] = ids as [string, string, string, string];
    store().reorderTasks([b, d]); // só b e d estavam visíveis; troca os dois
    const order = [...store().tasks].sort((x, y) => x.order - y.order).map((t) => t.title);
    expect(order).toEqual(['b', 'c', 'd', 'a']);
  });

  it('passos: adicionar (ignora vazio), editar e remover', () => {
    const id = store().addTask({ title: 'x' });
    store().addSubtask(id, '   ');
    store().addSubtask(id, 'Passo');
    const sub = task(id).subtasks[0]!;
    store().updateSubtask(id, sub.id, { title: 'Novo' });
    expect(task(id).subtasks.map((s) => s.title)).toEqual(['Novo']);
    store().deleteSubtask(id, sub.id);
    expect(task(id).subtasks).toEqual([]);
  });
});

describe('ações de listas e grupos', () => {
  beforeEach(() => useGameStore.setState(initialPersistedState()));

  it('cria, renomeia e move tarefa entre listas', () => {
    const listId = store().createList({ name: 'Trabalho' });
    const id = store().addTask({ title: 'x' });
    store().moveTask(id, listId);
    expect(task(id).listId).toBe(listId);
    store().moveTask(id, 'inexistente');
    expect(task(id).listId).toBe(listId);
    store().updateList(listId, { name: 'Guilda' });
    expect(store().lists.find((l) => l.id === listId)!.name).toBe('Guilda');
  });

  it('excluir lista remove as tarefas e pode ser desfeito; a lista padrão é protegida', () => {
    const listId = store().createList({ name: 'Temp' });
    store().addTask({ title: 'x', listId });
    store().addTask({ title: 'y' });
    const removed = store().deleteList(listId)!;
    expect(removed.tasks).toHaveLength(1);
    expect(store().tasks).toHaveLength(1);
    store().restoreList(removed.list, removed.tasks);
    expect(store().tasks).toHaveLength(2);
    expect(store().deleteList('inbox')).toBeUndefined();
  });

  it('desfazer grupo deixa as listas sem grupo', () => {
    const groupId = store().createGroup('Casa');
    const listId = store().createList({ name: 'Compras', groupId });
    store().deleteGroup(groupId);
    expect(store().groups).toEqual([]);
    expect(store().lists.find((l) => l.id === listId)!.groupId).toBeUndefined();
  });

  it('reordena listas e guarda a ordenação por visão', () => {
    const a = store().createList({ name: 'A' });
    const b = store().createList({ name: 'B' });
    store().reorderLists([b, a]);
    const names = [...store().lists].sort((x, y) => x.order - y.order).map((l) => l.name);
    expect(names).toEqual(['Tarefas', 'B', 'A']);
    store().setViewSort('my-day', 'alpha');
    expect(store().viewPrefs['my-day']).toBe('alpha');
  });
});
