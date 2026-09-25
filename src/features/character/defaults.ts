import { maxHp, maxMp } from '@/features/progression/formulas';
import { gameDayKey } from '@/lib/date';
import type { Character, LifetimeStats } from '@/store/types';

/** Personagem inicial (ainda sem nome — a criação de personagem preenche). */
export function defaultCharacter(): Character {
  return {
    name: '',
    classId: 'warrior',
    appearance: { body: 'a', skin: 0, hairStyle: 0, hairColor: 0, eyes: 0, outfit: 0 },
    level: 1,
    xp: 0,
    hp: maxHp(1),
    mp: maxMp(1),
    gold: 0,
    stats: { str: 5, int: 5, agi: 5, vit: 5 },
    unspentPoints: 0,
    equipped: {},
    inventory: [],
    achievements: [],
    lastDayProcessed: gameDayKey(new Date()),
  };
}

export function defaultLifetime(): LifetimeStats {
  return { tasksCompleted: 0, xpEarned: 0, goldEarned: 0, criticals: 0, bestStreak: 0 };
}
