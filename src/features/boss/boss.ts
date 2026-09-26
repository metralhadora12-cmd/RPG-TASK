/**
 * Chefe da semana — regras puras (sem relógio nem store).
 * Cada semana aparece um chefe; concluir tarefas e hábitos "+" tira HP dele.
 * Derrotá-lo dá XP e Gold uma única vez.
 */
import { format, parseISO, startOfWeek } from 'date-fns';
import { xpToNextLevel } from '@/features/progression/formulas';
import type { Difficulty } from '@/store/types';

export const BOSS_IDS = ['slime-king', 'sloth-dragon', 'clock-ghost', 'chaos-cat'] as const;
export type BossId = (typeof BOSS_IDS)[number];

/** Dano no chefe por dificuldade da tarefa. */
export const BOSS_DAMAGE: Record<Difficulty, number> = {
  trivial: 3,
  easy: 6,
  medium: 12,
  hard: 24,
  epic: 48,
};
export const BOSS_HP_BASE = 150;
export const BOSS_HP_PER_LEVEL = 25;
export const BOSS_HP_MAX = 1000;

/** Primeiro dia (yyyy-MM-dd) da semana que contém `day`. */
export function weekKey(day: string, weekStartsOn: 0 | 1): string {
  return format(startOfWeek(parseISO(day), { weekStartsOn }), 'yyyy-MM-dd');
}

/** Dias restantes na semana (contando hoje). */
export function daysLeftInWeek(day: string, weekStartsOn: 0 | 1): number {
  const start = parseISO(weekKey(day, weekStartsOn)).getTime();
  const elapsed = Math.round((parseISO(day).getTime() - start) / 86_400_000);
  return 7 - elapsed;
}

/** O chefe da semana gira em ordem fixa (mesma semana = mesmo chefe). */
export function bossForWeek(week: string): BossId {
  const weeks = Math.floor(parseISO(week).getTime() / (7 * 86_400_000));
  return BOSS_IDS[((weeks % BOSS_IDS.length) + BOSS_IDS.length) % BOSS_IDS.length]!;
}

/** HP do chefe conforme o nível do herói no início da semana. */
export function bossMaxHp(level: number): number {
  return Math.min(BOSS_HP_MAX, BOSS_HP_BASE + BOSS_HP_PER_LEVEL * (level - 1));
}

/** Dano de uma conclusão (crítico dobra). */
export function bossDamage(difficulty: Difficulty, critical = false): number {
  return BOSS_DAMAGE[difficulty] * (critical ? 2 : 1);
}

/** Recompensa por derrotar o chefe. */
export function bossReward(level: number): { xp: number; gold: number } {
  return { xp: Math.round(xpToNextLevel(level) * 0.3), gold: 20 + 5 * level };
}
