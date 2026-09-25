import { describe, expect, it } from 'vitest';
import { gameDayKey } from './date';

describe('gameDayKey', () => {
  it('usa a data do calendário com virada à meia-noite', () => {
    expect(gameDayKey(new Date(2026, 8, 25, 0, 30))).toBe('2026-09-25');
  });

  it('respeita o horário de virada do dia', () => {
    expect(gameDayKey(new Date(2026, 8, 25, 2, 0), 4)).toBe('2026-09-24');
    expect(gameDayKey(new Date(2026, 8, 25, 4, 0), 4)).toBe('2026-09-25');
  });
});
