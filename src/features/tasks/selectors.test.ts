import { describe, expect, it } from 'vitest';
import {
  countOpen,
  groupPlanned,
  myDaySuggestions,
  searchTasks,
  selectViewTasks,
  sortTasks,
} from './selectors';
import { makeTask } from './testUtils';

const today = '2026-09-25'; // sexta-feira

describe('selectViewTasks', () => {
  const tasks = [
    makeTask({ id: 'day', myDayDate: today }),
    makeTask({ id: 'yesterday', myDayDate: '2026-09-24' }),
    makeTask({ id: 'star', important: true, listId: 'work' }),
    makeTask({ id: 'due', dueDate: '2026-09-30' }),
    makeTask({ id: 'done', completedAt: '2026-09-25T09:00:00.000Z', myDayDate: today, dueDate: today }),
    makeTask({ id: 'habit', kind: 'habit' }),
  ];
  const ids = (list: { id: string }[]) => list.map((t) => t.id);

  it('Meu Dia só inclui o dia atual (reseta na virada)', () => {
    const v = selectViewTasks(tasks, { type: 'smart', id: 'my-day' }, { today });
    expect(ids(v.open)).toEqual(['day']);
    expect(ids(v.done)).toEqual(['done']);
  });

  it('Importante, Planejado, Todas e Concluídas', () => {
    expect(ids(selectViewTasks(tasks, { type: 'smart', id: 'important' }, { today }).open)).toEqual(['star']);
    expect(ids(selectViewTasks(tasks, { type: 'smart', id: 'planned' }, { today }).open)).toEqual(['due']);
    expect(ids(selectViewTasks(tasks, { type: 'smart', id: 'all' }, { today }).open)).toEqual([
      'day',
      'yesterday',
      'star',
      'due',
    ]);
    expect(ids(selectViewTasks(tasks, { type: 'smart', id: 'completed' }, { today }).done)).toEqual(['done']);
  });

  it('lista do usuário filtra por listId e ignora hábitos', () => {
    expect(ids(selectViewTasks(tasks, { type: 'list', id: 'work' }, { today }).open)).toEqual(['star']);
    expect(countOpen(tasks, { type: 'list', id: 'inbox' }, { today })).toBe(3);
    expect(countOpen(tasks, { type: 'smart', id: 'completed' }, { today })).toBe(1);
  });
});

describe('groupPlanned', () => {
  it('distribui por Atrasadas / Hoje / Amanhã / Esta semana / Depois', () => {
    const tasks = [
      makeTask({ id: 'late', dueDate: '2026-09-20' }),
      makeTask({ id: 'today', dueDate: today }),
      makeTask({ id: 'tomorrow', dueDate: '2026-09-26' }),
      makeTask({ id: 'later', dueDate: '2026-09-27' }),
    ];
    // Semana começando no domingo: sábado 26 é o fim; domingo 27 já é "Depois".
    const sunday = groupPlanned(tasks, today, 0);
    expect(sunday.overdue.map((t) => t.id)).toEqual(['late']);
    expect(sunday.today.map((t) => t.id)).toEqual(['today']);
    expect(sunday.tomorrow.map((t) => t.id)).toEqual(['tomorrow']);
    expect(sunday.thisWeek).toEqual([]);
    expect(sunday.later.map((t) => t.id)).toEqual(['later']);
    // Semana começando na segunda: domingo 27 ainda é "Esta semana".
    expect(groupPlanned(tasks, today, 1).thisWeek.map((t) => t.id)).toEqual(['later']);
  });
});

describe('sortTasks', () => {
  const a = makeTask({ id: 'a', title: 'Zebra', order: 1, difficulty: 'trivial', dueDate: '2026-10-01' });
  const b = makeTask({ id: 'b', title: 'ábaco', order: 2, difficulty: 'epic', important: true });
  const c = makeTask({ id: 'c', title: 'Maçã', order: 0, difficulty: 'medium', dueDate: '2026-09-26' });
  const ids = (list: { id: string }[]) => list.map((t) => t.id);

  it.each([
    ['manual', ['c', 'a', 'b']],
    ['dueDate', ['c', 'a', 'b']],
    ['importance', ['b', 'c', 'a']],
    ['difficulty', ['b', 'c', 'a']],
    ['alpha', ['b', 'c', 'a']],
  ] as const)('%s', (mode, expected) => {
    expect(ids(sortTasks([a, b, c], mode))).toEqual(expected);
  });

  it('não altera o array original', () => {
    const input = [a, b, c];
    sortTasks(input, 'alpha');
    expect(ids(input)).toEqual(['a', 'b', 'c']);
  });
});

describe('searchTasks', () => {
  const tasks = [
    makeTask({ id: 'a', title: 'Comprar poção', tags: ['mercado'] }),
    makeTask({ id: 'b', title: 'Estudar', notes: 'Capítulo sobre magia' }),
    makeTask({ id: 'c', title: 'Treino', subtasks: [{ id: 's', title: 'Espada', done: false }] }),
  ];
  const ids = (list: { id: string }[]) => list.map((t) => t.id);

  it('ignora acentos e caixa e busca em notas e passos', () => {
    expect(ids(searchTasks(tasks, 'POCAO'))).toEqual(['a']);
    expect(ids(searchTasks(tasks, 'capitulo'))).toEqual(['b']);
    expect(ids(searchTasks(tasks, 'espada'))).toEqual(['c']);
  });

  it('#tag procura só nas tags e todas as palavras precisam casar', () => {
    expect(ids(searchTasks(tasks, '#merc'))).toEqual(['a']);
    expect(ids(searchTasks(tasks, '#comprar'))).toEqual([]);
    expect(ids(searchTasks(tasks, 'comprar treino'))).toEqual([]);
    expect(searchTasks(tasks, '   ')).toEqual([]);
  });
});

describe('myDaySuggestions', () => {
  it('sugere atrasadas, de hoje e do Meu Dia anterior', () => {
    const tasks = [
      makeTask({ id: 'late', dueDate: '2026-09-20' }),
      makeTask({ id: 'today', dueDate: today }),
      makeTask({ id: 'future', dueDate: '2026-10-20' }),
      makeTask({ id: 'yesterday', myDayDate: '2026-09-24' }),
      makeTask({ id: 'already', myDayDate: today, dueDate: today }),
      makeTask({ id: 'done', dueDate: today, completedAt: 'x' }),
    ];
    expect(myDaySuggestions(tasks, today).map((t) => t.id)).toEqual(['late', 'today', 'yesterday']);
  });
});
