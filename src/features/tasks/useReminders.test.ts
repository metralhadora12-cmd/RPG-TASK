import { describe, expect, it } from 'vitest';
import { makeTask } from './testUtils';
import { dueReminders } from './useReminders';

describe('dueReminders', () => {
  const now = '2026-09-25T10:00';

  it('dispara lembretes vencidos uma única vez', () => {
    const tasks = [
      makeTask({ id: 'due', reminderAt: '2026-09-25T09:59' }),
      makeTask({ id: 'future', reminderAt: '2026-09-25T10:01' }),
      makeTask({ id: 'fired', reminderAt: '2026-09-25T09:00', reminderFiredAt: '2026-09-25T09:00' }),
      makeTask({ id: 'done', reminderAt: '2026-09-25T09:00', completedAt: 'x' }),
      makeTask({ id: 'none' }),
    ];
    expect(dueReminders(tasks, now).map((t) => t.id)).toEqual(['due']);
  });

  it('um lembrete remarcado depois do disparo volta a valer', () => {
    const task = makeTask({ reminderAt: '2026-09-25T09:30', reminderFiredAt: '2026-09-25T09:00' });
    expect(dueReminders([task], now)).toHaveLength(1);
  });
});
