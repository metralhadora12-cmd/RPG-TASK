import { describe, expect, it } from 'vitest';
import { bossDamage, bossForWeek, bossMaxHp, bossReward, BOSS_HP_MAX, BOSS_IDS, daysLeftInWeek, weekKey } from './boss';

describe('chefe da semana (fórmulas)', () => {
  it('semana começa no dia configurado', () => {
    // 2026-09-26 é sábado.
    expect(weekKey('2026-09-26', 0)).toBe('2026-09-20');
    expect(weekKey('2026-09-26', 1)).toBe('2026-09-21');
    expect(weekKey('2026-09-20', 0)).toBe('2026-09-20');
    expect(daysLeftInWeek('2026-09-20', 0)).toBe(7);
    expect(daysLeftInWeek('2026-09-26', 0)).toBe(1);
  });

  it('o chefe é o mesmo na semana toda e muda na seguinte', () => {
    const a = bossForWeek('2026-09-20');
    expect(BOSS_IDS).toContain(a);
    expect(bossForWeek('2026-09-27')).not.toBe(a);
    const four = ['2026-09-20', '2026-09-27', '2026-10-04', '2026-10-11'].map(bossForWeek);
    expect(new Set(four).size).toBe(4);
  });

  it('HP cresce com o nível e tem teto', () => {
    expect(bossMaxHp(1)).toBe(150);
    expect(bossMaxHp(11)).toBe(400);
    expect(bossMaxHp(99)).toBe(BOSS_HP_MAX);
  });

  it('dano por dificuldade, dobrado no crítico', () => {
    expect(bossDamage('trivial')).toBe(3);
    expect(bossDamage('epic')).toBe(48);
    expect(bossDamage('medium', true)).toBe(24);
  });

  it('recompensa escala com o nível', () => {
    expect(bossReward(1)).toEqual({ xp: 23, gold: 25 });
    expect(bossReward(10).gold).toBe(70);
  });
});
