import { describe, expect, it } from 'vitest';
import { describeRecurrence, nextOccurrence, shiftDateTime, stepRecurrence } from './recurrence';

describe('stepRecurrence', () => {
  it('diária avança um dia', () => {
    expect(stepRecurrence('2026-09-25', { type: 'daily' })).toBe('2026-09-26');
  });

  it('dias úteis pula o fim de semana', () => {
    // 2026-09-25 é sexta-feira
    expect(stepRecurrence('2026-09-25', { type: 'weekdays' })).toBe('2026-09-28');
    expect(stepRecurrence('2026-09-28', { type: 'weekdays' })).toBe('2026-09-29');
  });

  it('semanal vai para o próximo dia escolhido', () => {
    // sex → próxima segunda (1) ou quarta (3)
    expect(stepRecurrence('2026-09-25', { type: 'weekly', days: [1, 3] })).toBe('2026-09-28');
    expect(stepRecurrence('2026-09-28', { type: 'weekly', days: [1, 3] })).toBe('2026-09-30');
    expect(stepRecurrence('2026-09-25', { type: 'weekly', days: [] })).toBe('2026-10-02');
    expect(stepRecurrence('2026-09-25', { type: 'weekly', days: [5] })).toBe('2026-10-02');
  });

  it('mensal ajusta o fim do mês', () => {
    expect(stepRecurrence('2026-01-31', { type: 'monthly' })).toBe('2026-02-28');
    expect(stepRecurrence('2026-09-25', { type: 'monthly' })).toBe('2026-10-25');
  });

  it('anual e a cada N dias', () => {
    expect(stepRecurrence('2028-02-29', { type: 'yearly' })).toBe('2029-02-28');
    expect(stepRecurrence('2026-09-25', { type: 'everyNDays', interval: 3 })).toBe('2026-09-28');
    expect(stepRecurrence('2026-09-25', { type: 'everyNDays', interval: 0 })).toBe('2026-09-26');
  });
});

describe('nextOccurrence', () => {
  it('usa o passo normal quando a tarefa está em dia', () => {
    expect(nextOccurrence('2026-09-25', { type: 'daily' }, '2026-09-25')).toBe('2026-09-26');
  });

  it('não gera ocorrência no passado para tarefas atrasadas', () => {
    expect(nextOccurrence('2026-09-01', { type: 'daily' }, '2026-09-25')).toBe('2026-09-25');
    expect(nextOccurrence('2026-09-01', { type: 'weekly', days: [1] }, '2026-09-25')).toBe('2026-09-28');
  });
});

describe('shiftDateTime', () => {
  it('mantém o horário e desloca os dias', () => {
    expect(shiftDateTime('2026-09-25T09:30', '2026-09-25', '2026-09-28')).toBe('2026-09-28T09:30');
  });
});

describe('describeRecurrence', () => {
  it('descreve em pt-BR', () => {
    expect(describeRecurrence({ type: 'weekly', days: [3, 1] })).toBe('Semanal: seg, qua');
    expect(describeRecurrence({ type: 'everyNDays', interval: 4 })).toBe('A cada 4 dias');
  });
});
