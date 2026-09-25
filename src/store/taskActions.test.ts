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
    expect(store().completeTask(id).reward).toBeDefined();
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

describe('progressão ao concluir', () => {
  const noLuck = () => 0.5; // Gold ×1,0 e sem crítico
  const hero = () => store().character;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
    useGameStore.setState(initialPersistedState());
  });
  afterEach(() => vi.useRealTimers());

  it('dá XP e Gold conforme dificuldade, passos e pontualidade', () => {
    const id = store().addTask({ title: 'x', difficulty: 'medium', dueDate: '2026-09-25' });
    store().addSubtask(id, 'a');
    store().updateSubtask(id, task(id).subtasks[0]!.id, { done: true });
    const { reward } = store().completeTask(id, { random: noLuck });
    // 20 × (1 + 0,1 + 0,2) = 26 XP; 6 × 1,3 = 7,8 → 8 G
    expect(reward).toMatchObject({ xp: 26, gold: 8, critical: false, levelsGained: 0 });
    expect(hero()).toMatchObject({ xp: 26, gold: 8, level: 1 });
    expect(store().lifetime).toMatchObject({ tasksCompleted: 1, xpEarned: 26, goldEarned: 8 });
    expect(store().rewardLog).toHaveLength(1);
  });

  it('atrasada não ganha bônus de pontualidade', () => {
    const id = store().addTask({ title: 'x', difficulty: 'medium', dueDate: '2026-09-24' });
    expect(store().completeTask(id, { random: noLuck }).reward!.xp).toBe(20);
  });

  it('level up recupera HP e dá pontos; reabrir estorna tudo', () => {
    useGameStore.setState({ character: { ...hero(), xp: 70, hp: 10 } });
    const before = hero();
    const id = store().addTask({ title: 'x', difficulty: 'epic' });
    const { reward } = store().completeTask(id, { random: noLuck });
    expect(reward).toMatchObject({ fromLevel: 1, toLevel: 2, levelsGained: 1, pointsGained: 2 });
    expect(hero()).toMatchObject({ level: 2, hp: 60, unspentPoints: 2 });
    store().uncompleteTask(id);
    expect(hero()).toEqual(before);
    expect(store().rewardLog[0]!.revertedAt).toBeDefined();
    expect(store().lifetime.tasksCompleted).toBe(0);
  });

  it('concluir/reabrir repetidamente não gera XP/Gold (sem farm)', () => {
    const id = store().addTask({ title: 'x', difficulty: 'hard' });
    for (let i = 0; i < 10; i++) {
      store().completeTask(id);
      store().uncompleteTask(id);
    }
    expect(hero()).toMatchObject({ xp: 0, gold: 0, level: 1 });
  });

  it('desfazer várias conclusões em qualquer ordem volta ao estado inicial', () => {
    const before = hero();
    const ids = (['trivial', 'easy', 'medium', 'hard', 'epic', 'epic', 'hard'] as const).map((difficulty) =>
      store().addTask({ title: difficulty, difficulty }),
    );
    for (const id of ids) store().completeTask(id);
    expect(hero().level).toBeGreaterThan(1);
    for (const id of [ids[3], ids[0], ids[6], ids[1], ids[5], ids[2], ids[4]]) store().uncompleteTask(id!);
    expect(hero()).toEqual(before);
  });

  it('reabrir remove a próxima ocorrência intocada de uma recorrente', () => {
    const id = store().addTask({ title: 'x', dueDate: '2026-09-25' });
    store().updateTask(id, { recurrence: { type: 'daily' } });
    const { spawnedId } = store().completeTask(id);
    expect(task(spawnedId!)).toBeDefined();
    store().uncompleteTask(id);
    expect(store().tasks.map((t) => t.id)).toEqual([id]);
  });

  it('concluir tarefa já concluída não dá recompensa de novo', () => {
    const id = store().addTask({ title: 'x' });
    store().completeTask(id);
    const gold = hero().gold;
    expect(store().completeTask(id)).toEqual({});
    expect(hero().gold).toBe(gold);
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
