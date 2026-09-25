import { describe, expect, it } from 'vitest';
import type { ClassId, Difficulty } from '@/store/types';
import {
  applyReward,
  computeReward,
  goldRange,
  levelFromTotalXp,
  MAX_LEVEL,
  maxHp,
  maxMp,
  POINTS_PER_LEVEL,
  revertReward,
  totalXpForLevel,
  xpToNextLevel,
  type ProgressState,
  type RewardInput,
} from './formulas';

/** Gerador determinístico que devolve os valores em sequência. */
const fixed = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

const input = (overrides: Partial<RewardInput> = {}): RewardInput => ({
  difficulty: 'medium',
  subtasksDone: 0,
  onTime: false,
  streak: 0,
  classId: 'warrior',
  // roll de Gold neutro (0,5 → ×1,0) e sem crítico (0,99)
  random: fixed(0.5, 0.99),
  ...overrides,
});

describe('xpToNextLevel', () => {
  it('segue round(25 * n^1.5 + 50)', () => {
    expect(xpToNextLevel(1)).toBe(75);
    expect(xpToNextLevel(4)).toBe(250);
    expect(xpToNextLevel(10)).toBe(841);
  });

  it('é estritamente crescente', () => {
    for (let n = 1; n < 99; n++) expect(xpToNextLevel(n + 1)).toBeGreaterThan(xpToNextLevel(n));
  });
});

describe('maxHp / maxMp', () => {
  it('HP = 50 + 5 por nível', () => {
    expect(maxHp(1)).toBe(55);
    expect(maxHp(10)).toBe(100);
  });

  it('MP cresce com o nível', () => {
    expect(maxMp(2)).toBeGreaterThan(maxMp(1));
  });
});

describe('computeReward — valores base', () => {
  it.each([
    ['trivial', 5, 1],
    ['easy', 10, 3],
    ['medium', 20, 6],
    ['hard', 40, 12],
    ['epic', 80, 25],
  ] as [Difficulty, number, number][])('%s → %i XP / %i G', (difficulty, xp, gold) => {
    // Ladino e Mago mudam XP/Gold; Clérigo não tem bônus de recompensa.
    const r = computeReward(input({ difficulty, classId: 'cleric' }));
    expect(r).toMatchObject({ xp, gold, critical: false });
  });
});

describe('computeReward — modificadores', () => {
  const cleric = { classId: 'cleric' as ClassId };

  it('+10% por passo concluído, no máximo +50%', () => {
    expect(computeReward(input({ ...cleric, subtasksDone: 2 })).xp).toBe(24);
    expect(computeReward(input({ ...cleric, subtasksDone: 9 })).xp).toBe(30);
  });

  it('+20% por pontualidade', () => {
    expect(computeReward(input({ ...cleric, onTime: true })).xp).toBe(24);
  });

  it('+2% por dia de sequência, no máximo +40%', () => {
    expect(computeReward(input({ ...cleric, streak: 5 })).xp).toBe(22);
    expect(computeReward(input({ ...cleric, streak: 100 })).xp).toBe(28);
  });

  it('bônus são somados', () => {
    // 20 × (1 + 0,5 + 0,2 + 0,4) = 42
    expect(computeReward(input({ ...cleric, subtasksDone: 5, onTime: true, streak: 20 })).xp).toBe(42);
  });

  it('Guerreiro: +15% XP só em Difícil/Épica', () => {
    expect(computeReward(input({ difficulty: 'medium' })).xp).toBe(20);
    expect(computeReward(input({ difficulty: 'hard' })).xp).toBe(46);
    expect(computeReward(input({ difficulty: 'epic' })).xp).toBe(92);
  });

  it('Mago: +10% XP geral', () => {
    expect(computeReward(input({ classId: 'mage' })).xp).toBe(22);
  });

  it('Ladino: +20% Gold', () => {
    const r = computeReward(input({ classId: 'rogue', difficulty: 'epic' }));
    expect(r.gold).toBe(30);
    expect(r.xp).toBe(80);
  });
});

describe('computeReward — sorte', () => {
  it('Gold varia ±15%', () => {
    expect(computeReward(input({ ...{ classId: 'cleric' }, difficulty: 'epic', random: fixed(0, 0.99) })).gold).toBe(21);
    expect(computeReward(input({ classId: 'cleric', difficulty: 'epic', random: fixed(0.999999, 0.99) })).gold).toBe(29);
  });

  it('drop crítico (5%) dobra o Gold', () => {
    const crit = computeReward(input({ classId: 'cleric', random: fixed(0.5, 0.01) }));
    expect(crit).toMatchObject({ critical: true, gold: 12, xp: 20 });
    expect(computeReward(input({ random: fixed(0.5, 0.05) })).critical).toBe(false);
  });

  it('Gold nunca é zero', () => {
    expect(computeReward(input({ classId: 'cleric', difficulty: 'trivial', random: fixed(0, 0.99) })).gold).toBe(1);
  });

  it('goldRange cobre todos os resultados sem crítico', () => {
    const base = input({ classId: 'rogue', difficulty: 'hard', subtasksDone: 3 });
    const [min, max] = goldRange(base);
    for (let r = 0; r < 1; r += 0.05) {
      const gold = computeReward({ ...base, random: fixed(r, 0.99) }).gold;
      expect(gold).toBeGreaterThanOrEqual(min);
      expect(gold).toBeLessThanOrEqual(max);
    }
  });
});

describe('XP total ↔ nível', () => {
  it('ida e volta', () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(totalXpForLevel(2)).toBe(75);
    for (const level of [1, 2, 7, 50, 98]) {
      expect(levelFromTotalXp(totalXpForLevel(level) + 3)).toEqual({ level, xp: 3 });
    }
  });

  it('para no nível 99', () => {
    const { level, xp } = levelFromTotalXp(10 ** 9);
    expect(level).toBe(MAX_LEVEL);
    expect(xp).toBe(xpToNextLevel(MAX_LEVEL) - 1);
  });
});

describe('applyReward / revertReward', () => {
  const start: ProgressState = { level: 1, xp: 60, hp: 20, mp: 5, gold: 10, unspentPoints: 0 };

  it('sobe de nível: HP/MP cheios e pontos de atributo', () => {
    const { state, delta } = applyReward(start, 20, 6);
    expect(state).toEqual({ level: 2, xp: 5, hp: maxHp(2), mp: maxMp(2), gold: 16, unspentPoints: POINTS_PER_LEVEL });
    expect(delta).toMatchObject({ levelsGained: 1, hpHealed: maxHp(2) - 20, pointsGained: POINTS_PER_LEVEL });
  });

  it('pode subir vários níveis de uma vez', () => {
    const { state, delta } = applyReward(start, 1000, 0);
    expect(state.level).toBe(levelFromTotalXp(60 + 1000).level);
    expect(delta.levelsGained).toBe(state.level - 1);
  });

  it('desfazer volta exatamente ao estado anterior', () => {
    for (const [xp, gold] of [
      [5, 1],
      [15, 3],
      [20, 6],
      [500, 25],
    ] as const) {
      const { state, delta } = applyReward(start, xp, gold);
      expect(revertReward(state, delta)).toEqual(start);
    }
  });

  it('desfazer em qualquer ordem mantém XP/Gold consistentes', () => {
    // Propriedade: aplicar N recompensas e desfazê-las em ordem embaralhada volta ao início.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let round = 0; round < 50; round++) {
      let state: ProgressState = { level: 1 + Math.floor(rand() * 20), xp: 0, hp: 30, mp: 10, gold: 50, unspentPoints: 1 };
      state = { ...state, hp: maxHp(state.level) };
      const initial = state;
      const deltas = [];
      for (let i = 0; i < 8; i++) {
        const r = applyReward(state, Math.floor(rand() * 200), Math.floor(rand() * 30));
        state = r.state;
        deltas.push(r.delta);
      }
      deltas.sort(() => rand() - 0.5);
      for (const d of deltas) state = revertReward(state, d);
      expect(state.level).toBe(initial.level);
      expect(state.xp).toBe(initial.xp);
      expect(state.gold).toBe(initial.gold);
      expect(state.unspentPoints).toBe(initial.unspentPoints);
    }
  });

  it('ouro não fica negativo se já foi gasto', () => {
    const { state, delta } = applyReward(start, 5, 6);
    expect(revertReward({ ...state, gold: 2 }, delta).gold).toBe(0);
  });
});
