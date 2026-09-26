import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { maxHp } from '@/features/progression/formulas';
import { heroState } from '@/test/state';
import { useGameStore } from './useGameStore';

const store = () => useGameStore.getState();
const hero = () => store().character;
const task = (id: string) => store().tasks.find((t) => t.id === id)!;
const noLuck = () => 0.5;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
  useGameStore.setState(heroState());
  useGameStore.setState((s) => ({ character: { ...s.character, lastDayProcessed: '2026-09-25' } }));
});
afterEach(() => vi.useRealTimers());

describe('rotinas: sequência', () => {
  it('concluir soma sequência e dá bônus de +2%/dia; reabrir devolve', () => {
    const id = store().addTask({ title: 'Meditar', kind: 'daily', difficulty: 'medium' });
    expect(task(id).recurrence).toEqual({ type: 'daily' });
    store().updateTask(id, { streak: 10 });
    const { reward } = store().completeTask(id, { random: noLuck });
    expect(reward!.xp).toBe(24); // 20 × 1,2
    expect(task(id).streak).toBe(11);
    expect(store().lifetime.bestStreak).toBe(11);
    store().uncompleteTask(id);
    expect(task(id).streak).toBe(10);
  });

  it('rotina não ganha bônus de pontualidade nem cria próxima ocorrência', () => {
    const id = store().addTask({ title: 'x', kind: 'daily', difficulty: 'medium', dueDate: '2026-09-25' });
    const r = store().completeTask(id, { random: noLuck });
    expect(r.reward!.xp).toBe(20);
    expect(r.spawnedId).toBeUndefined();
  });
});

describe('hábitos', () => {
  it('+ dá recompensa e conta; desfazer estorna', () => {
    const id = store().addTask({ title: 'Beber água', kind: 'habit', difficulty: 'easy' });
    const r = store().habitUp(id, { random: noLuck })!;
    expect(r).toMatchObject({ xp: 10, gold: 3 });
    expect(task(id).habitCounts).toEqual({ up: 1, down: 0, date: '2026-09-25' });
    expect(store().revertHabit(r.eventId)).toBe(true);
    expect(hero()).toMatchObject({ xp: 0, gold: 0 });
    expect(task(id).habitCounts!.up).toBe(0);
    expect(store().revertHabit(r.eventId)).toBe(false); // só uma vez
  });

  it('− tira HP (Clérigo −30%) e desfazer devolve', () => {
    const id = store().addTask({ title: 'Doce', kind: 'habit', difficulty: 'epic' });
    const before = hero().hp;
    const r = store().habitDown(id)!;
    expect(r.hpLost).toBe(10);
    expect(hero().hp).toBe(before - 10);
    store().revertHabit(r.eventId);
    expect(hero().hp).toBe(before);
    useGameStore.setState((s) => ({ character: { ...s.character, classId: 'cleric' } }));
    expect(store().habitDown(id)!.hpLost).toBe(7);
  });

  it('penalidades desligadas: − não causa dano', () => {
    store().updateSettings({ penaltiesEnabled: false });
    const id = store().addTask({ title: 'x', kind: 'habit', difficulty: 'epic' });
    expect(store().habitDown(id)!.hpLost).toBe(0);
    expect(task(id).habitCounts!.down).toBe(1);
  });

  it('− que leva a 0 HP desmaia e não pode ser desfeito', () => {
    useGameStore.setState((s) => ({ character: { ...s.character, hp: 4, xp: 50, gold: 100 } }));
    const id = store().addTask({ title: 'x', kind: 'habit', difficulty: 'medium' });
    const r = store().habitDown(id)!;
    expect(r.faint).toEqual({ xpLost: 50, goldLost: 10, level: 1 });
    expect(hero()).toMatchObject({ hp: maxHp(1), xp: 0, gold: 90 });
    expect(store().pendingFaint).toEqual(r.faint);
    expect(store().revertHabit(r.eventId)).toBe(false);
  });
});

describe('virada do dia', () => {
  it('nada a fazer no mesmo dia', () => {
    expect(store().processDayRollover()).toBeNull();
  });

  it('aplica dano das rotinas perdidas, zera sequência e gera relatório', () => {
    const missed = store().addTask({ title: 'Treinar', kind: 'daily', difficulty: 'hard' });
    const done = store().addTask({ title: 'Ler', kind: 'daily', difficulty: 'easy' });
    store().updateTask(missed, { streak: 4 });
    store().completeTask(done);
    const hp = hero().hp;

    vi.setSystemTime(new Date(2026, 8, 26, 8, 0));
    const report = store().processDayRollover()!;
    expect(report).toMatchObject({
      day: '2026-09-25',
      missed: [{ title: 'Treinar', damage: 7 }],
      completed: ['Ler'],
      streaksLost: [{ title: 'Treinar', streak: 4 }],
      hpLost: 7,
      faint: null,
    });
    expect(hero()).toMatchObject({ hp: hp - 7, lastDayProcessed: '2026-09-26' });
    expect(task(missed).streak).toBe(0);
    expect(task(done)).toMatchObject({ completedAt: undefined, streak: 1 });
    expect(store().pendingReport).toEqual(report);
    // Rodar de novo no mesmo dia não repete o dano.
    expect(store().processDayRollover()).toBeNull();
    store().dismissReport();
    expect(store().pendingReport).toBeNull();
  });

  it('dano suficiente desmaia o herói na virada', () => {
    useGameStore.setState((s) => ({ character: { ...s.character, hp: 5, xp: 30, gold: 55 } }));
    store().addTask({ title: 'A', kind: 'daily', difficulty: 'epic' });
    const report = store().processDayRollover(new Date(2026, 8, 26, 8, 0))!;
    expect(report.faint).toEqual({ xpLost: 30, goldLost: 5, level: 1 });
    expect(hero()).toMatchObject({ hp: maxHp(1), xp: 0, gold: 50 });
    expect(store().pendingFaint).toEqual(report.faint);
  });

  it('não roda antes do herói existir', () => {
    useGameStore.setState((s) => ({ character: { ...s.character, name: '' } }));
    store().addTask({ title: 'A', kind: 'daily' });
    expect(store().processDayRollover(new Date(2026, 8, 27))).toBeNull();
  });
});
