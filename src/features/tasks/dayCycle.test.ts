import { describe, expect, it } from 'vitest';
import { isDailyDue, rolloverDailies } from './dayCycle';
import { isDueOn } from './recurrence';
import type { Recurrence } from '@/store/types';
import { makeTask } from './testUtils';

describe('isDueOn', () => {
  const anchor = '2026-09-01'; // terça
  it.each([
    [{ type: 'daily' } as Recurrence, '2026-09-25', true],
    [{ type: 'weekdays' } as Recurrence, '2026-09-26', false], // sábado
    [{ type: 'weekdays' } as Recurrence, '2026-09-28', true],
    [{ type: 'weekly', days: [5] } as Recurrence, '2026-09-25', true],
    [{ type: 'weekly', days: [] } as Recurrence, '2026-09-29', true], // mesmo dia da semana da âncora
    [{ type: 'monthly' } as Recurrence, '2026-10-01', true],
    [{ type: 'monthly' } as Recurrence, '2026-10-02', false],
    [{ type: 'yearly' } as Recurrence, '2027-09-01', true],
    [{ type: 'everyNDays', interval: 3 } as Recurrence, '2026-09-04', true],
    [{ type: 'everyNDays', interval: 3 } as Recurrence, '2026-09-05', false],
    [{ type: 'daily' } as Recurrence, '2026-08-31', false], // antes de começar
  ])('%o em %s → %s', (rule, day, expected) => {
    expect(isDueOn(rule, anchor, day)).toBe(expected);
  });

  it('mensal no dia 31 vale no último dia de meses curtos', () => {
    expect(isDueOn({ type: 'monthly' }, '2026-01-31', '2026-02-28')).toBe(true);
    expect(isDueOn({ type: 'monthly' }, '2026-01-31', '2026-02-27')).toBe(false);
  });
});

describe('rolloverDailies', () => {
  const daily = (overrides = {}) =>
    makeTask({ kind: 'daily', recurrence: { type: 'daily' }, createdAt: '2026-09-01T12:00:00', ...overrides });

  it('rotina feita ontem volta pendente com passos desmarcados e mantém a sequência', () => {
    const t = daily({
      completedAt: '2026-09-24T20:00:00',
      streak: 3,
      subtasks: [{ id: 's', title: 'a', done: true }],
    });
    const r = rolloverDailies([t], '2026-09-24', '2026-09-25', 0);
    expect(r.missed).toEqual([]);
    expect(r.completed.map((c) => c.taskId)).toEqual([t.id]);
    expect(r.tasks[0]).toMatchObject({ completedAt: undefined, streak: 3, subtasks: [{ done: false }] });
  });

  it('rotina não feita: perdida, sequência zera', () => {
    const t = daily({ streak: 5 });
    const r = rolloverDailies([t], '2026-09-24', '2026-09-25', 0);
    expect(r.missed.map((m) => m.taskId)).toEqual([t.id]);
    expect(r.streaksLost).toEqual([{ taskId: t.id, title: t.title, streak: 5 }]);
    expect(r.tasks[0]!.streak).toBe(0);
  });

  it('rotina que não valia ontem não é perdida', () => {
    const t = daily({ recurrence: { type: 'weekdays' } });
    // 26/09 é sábado
    expect(rolloverDailies([t], '2026-09-26', '2026-09-27', 0).missed).toEqual([]);
  });

  it('vários dias sem abrir: dano uma vez só por rotina', () => {
    const t = daily({ completedAt: '2026-09-20T10:00:00' });
    const r = rolloverDailies([t], '2026-09-20', '2026-09-25', 0);
    expect(r.missed).toHaveLength(1);
    expect(r.tasks[0]!.completedAt).toBeUndefined();
  });

  it('respeita o horário de virada: concluída 02:00 com virada às 04:00 conta para o dia anterior', () => {
    const t = daily({ completedAt: '2026-09-25T02:00:00' });
    expect(rolloverDailies([t], '2026-09-24', '2026-09-25', 4).missed).toEqual([]);
  });

  it('não mexe em missões comuns e zera contadores de hábitos antigos', () => {
    const todo = makeTask({ completedAt: '2026-09-20T10:00:00' });
    const habit = makeTask({ kind: 'habit', habitCounts: { up: 3, down: 1, date: '2026-09-24' } });
    const r = rolloverDailies([todo, habit], '2026-09-24', '2026-09-25', 0);
    expect(r.tasks[0]).toBe(todo);
    expect(r.tasks[1]!.habitCounts).toEqual({ up: 0, down: 0, date: '2026-09-25' });
  });

  it('isDailyDue usa a data de criação como início', () => {
    const t = daily({ recurrence: { type: 'everyNDays', interval: 2 }, createdAt: '2026-09-23T09:00:00' });
    expect(isDailyDue(t, '2026-09-25')).toBe(true);
    expect(isDailyDue(t, '2026-09-24')).toBe(false);
  });
});
