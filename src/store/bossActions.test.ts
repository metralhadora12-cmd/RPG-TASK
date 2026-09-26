import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bossMaxHp, bossReward, BOSS_DAMAGE } from '@/features/boss/boss';
import { heroState } from '@/test/state';
import { useGameStore } from './useGameStore';

const store = () => useGameStore.getState();
const noCrit = () => 0.99; // sem crítico, gold no meio da faixa

describe('chefe da semana', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // sexta, 25/09/2026
    useGameStore.setState(heroState());
  });
  afterEach(() => vi.useRealTimers());

  it('aparece na semana atual com HP pelo nível', () => {
    const boss = store().syncBoss();
    expect(boss.week).toBe('2026-09-20'); // semana começa no domingo (padrão)
    expect(boss.maxHp).toBe(bossMaxHp(1));
    expect(boss.damage).toBe(0);
    expect(store().boss).toEqual(boss);
    expect(store().syncBoss()).toBe(store().boss); // estável na mesma semana
  });

  it('concluir tarefa causa dano; desfazer estorna', () => {
    const id = store().addTask({ title: 'Relatório', difficulty: 'hard' });
    const result = store().completeTask(id, { random: noCrit });
    expect(result.boss).toEqual({ damage: BOSS_DAMAGE.hard, defeated: false });
    expect(store().boss!.damage).toBe(BOSS_DAMAGE.hard);
    const event = store().rewardLog.find((e) => e.taskId === id)!;
    expect(event).toMatchObject({ bossDamage: BOSS_DAMAGE.hard, bossWeek: '2026-09-20' });
    store().uncompleteTask(id);
    expect(store().boss!.damage).toBe(0);
  });

  it('hábito "+" também bate; desfazer o hábito estorna', () => {
    const id = store().addTask({ title: 'Água', kind: 'habit', difficulty: 'easy' });
    const up = store().habitUp(id, { random: noCrit })!;
    expect(up.boss?.damage).toBe(BOSS_DAMAGE.easy);
    expect(store().revertHabit(up.eventId)).toBe(true);
    expect(store().boss!.damage).toBe(0);
  });

  it('derrota dá XP/Gold uma vez; desfazer a tarefa não tira a vitória', () => {
    store().syncBoss();
    useGameStore.setState((s) => ({ boss: { ...s.boss!, damage: s.boss!.maxHp - 10 } }));
    const gold0 = store().character.gold;
    const id = store().addTask({ title: 'Golpe final', difficulty: 'epic' });
    const result = store().completeTask(id, { random: noCrit });
    // O prêmio usa o nível depois da recompensa da própria tarefa.
    const prize = bossReward(result.reward!.toLevel);
    expect(result.boss).toMatchObject({ damage: 10, defeated: true, reward: { xp: prize.xp, gold: prize.gold } });
    expect(store().boss!.defeatedAt).toBeDefined();
    expect(store().lifetime.bossesDefeated).toBe(1);
    const bossEvent = store().rewardLog.find((e) => e.kind === 'boss')!;
    expect(bossEvent).toMatchObject({ final: true, gold: prize.gold });

    // Outra conclusão não bate mais nem paga de novo.
    const other = store().addTask({ title: 'Depois', difficulty: 'epic' });
    expect(store().completeTask(other, { random: noCrit }).boss).toEqual({ damage: 0, defeated: false });

    const taskGold = result.reward!.gold;
    store().uncompleteTask(id);
    expect(store().boss!.defeatedAt).toBeDefined();
    expect(store().lifetime.bossesDefeated).toBe(1);
    // Só o Gold da tarefa foi estornado; o prêmio do chefe fica.
    const otherGold = store().rewardLog.find((e) => e.taskId === other)!.gold;
    expect(store().character.gold).toBe(gold0 + prize.gold + otherGold);
    expect(taskGold).toBeGreaterThan(0);
  });

  it('semana nova traz outro chefe com HP cheio', () => {
    const id = store().addTask({ title: 'x', difficulty: 'medium' });
    store().completeTask(id, { random: noCrit });
    const first = store().boss!;
    vi.setSystemTime(new Date(2026, 8, 28, 10, 0)); // segunda da semana seguinte
    const next = store().syncBoss();
    expect(next.week).toBe('2026-09-27');
    expect(next.bossId).not.toBe(first.bossId);
    expect(next.damage).toBe(0);
    // Desfazer uma tarefa da semana passada não mexe no chefe novo.
    store().uncompleteTask(id);
    expect(store().boss!.damage).toBe(0);
  });
});
