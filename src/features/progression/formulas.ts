/**
 * Fórmulas do sistema de RPG — funções puras, cobertas por testes.
 * Nada aqui lê relógio, store ou Math.random diretamente: aleatoriedade é injetada.
 */
import type { ClassId, Difficulty } from '@/store/types';

export const MAX_LEVEL = 99;
export const BASE_HP = 50;
export const HP_PER_LEVEL = 5;
export const BASE_MP = 20;
export const MP_PER_LEVEL = 2;
/** Pontos de atributo ganhos a cada nível. */
export const POINTS_PER_LEVEL = 2;

/** XP necessário para sair do nível `n` e chegar ao `n + 1`. */
export function xpToNextLevel(level: number): number {
  return Math.round(25 * Math.pow(level, 1.5) + 50);
}

/** HP máximo no nível dado: 50 + 5 por nível. */
export function maxHp(level: number): number {
  return BASE_HP + HP_PER_LEVEL * level;
}

/** MP máximo no nível dado. */
export function maxMp(level: number): number {
  return BASE_MP + MP_PER_LEVEL * level;
}

// ---------------------------------------------------------------------------
// Recompensas
// ---------------------------------------------------------------------------

export const BASE_REWARDS: Record<Difficulty, { xp: number; gold: number }> = {
  trivial: { xp: 5, gold: 1 },
  easy: { xp: 10, gold: 3 },
  medium: { xp: 20, gold: 6 },
  hard: { xp: 40, gold: 12 },
  epic: { xp: 80, gold: 25 },
};

export const SUBTASK_BONUS = 0.1;
export const SUBTASK_BONUS_MAX = 0.5;
export const PUNCTUALITY_BONUS = 0.2;
export const STREAK_BONUS = 0.02;
export const STREAK_BONUS_MAX = 0.4;
export const GOLD_VARIANCE = 0.15;
export const CRITICAL_CHANCE = 0.05;
export const CRITICAL_MULTIPLIER = 2;

export const CLASS_BONUS = {
  /** Guerreiro: +15% XP em tarefas Difíceis/Épicas. */
  warriorHardXp: 0.15,
  /** Mago: +10% XP em tudo. */
  mageXp: 0.1,
  /** Ladino: +20% Gold. */
  rogueGold: 0.2,
  /** Clérigo: −30% nas penalidades de HP. */
  clericPenalty: 0.3,
} as const;

export interface RewardInput {
  difficulty: Difficulty;
  /** Passos concluídos da tarefa. */
  subtasksDone: number;
  /** Concluída no dia do vencimento ou antes. */
  onTime: boolean;
  /** Dias seguidos (só diárias). */
  streak: number;
  classId: ClassId;
  /** Gerador em [0, 1); injete um fixo nos testes. */
  random: () => number;
}

export interface RewardBreakdown {
  subtasks: number;
  punctuality: number;
  streak: number;
  classXp: number;
  classGold: number;
  /** Fator aleatório aplicado ao Gold (0,85 – 1,15). */
  goldRoll: number;
}

export interface Reward {
  xp: number;
  gold: number;
  critical: boolean;
  breakdown: RewardBreakdown;
}

/** Bônus percentuais que não dependem de sorte (usados também na prévia). */
export function rewardModifiers(input: Omit<RewardInput, 'random'>): Omit<RewardBreakdown, 'goldRoll'> {
  const hardOrEpic = input.difficulty === 'hard' || input.difficulty === 'epic';
  return {
    subtasks: Math.min(SUBTASK_BONUS_MAX, SUBTASK_BONUS * Math.max(0, input.subtasksDone)),
    punctuality: input.onTime ? PUNCTUALITY_BONUS : 0,
    streak: Math.min(STREAK_BONUS_MAX, STREAK_BONUS * Math.max(0, input.streak)),
    classXp:
      input.classId === 'mage'
        ? CLASS_BONUS.mageXp
        : input.classId === 'warrior' && hardOrEpic
          ? CLASS_BONUS.warriorHardXp
          : 0,
    classGold: input.classId === 'rogue' ? CLASS_BONUS.rogueGold : 0,
  };
}

function goldFor(input: Omit<RewardInput, 'random'>, roll: number, critical: boolean): number {
  const mods = rewardModifiers(input);
  const mult = 1 + mods.subtasks + mods.punctuality + mods.streak + mods.classGold;
  return Math.max(1, Math.round(BASE_REWARDS[input.difficulty].gold * mult * roll * (critical ? CRITICAL_MULTIPLIER : 1)));
}

/**
 * Recompensa por concluir uma tarefa. Os bônus são somados (aditivos):
 * XP = base × (1 + passos + pontualidade + sequência + classe)
 * Gold = base × (1 + passos + pontualidade + sequência + classe) × sorte(±15%) × crítico(×2, 5%)
 */
export function computeReward(input: RewardInput): Reward {
  const mods = rewardModifiers(input);
  const xp = Math.round(BASE_REWARDS[input.difficulty].xp * (1 + mods.subtasks + mods.punctuality + mods.streak + mods.classXp));
  const goldRoll = 1 - GOLD_VARIANCE + 2 * GOLD_VARIANCE * input.random();
  const critical = input.random() < CRITICAL_CHANCE;
  return { xp, gold: goldFor(input, goldRoll, critical), critical, breakdown: { ...mods, goldRoll } };
}

/** Faixa de Gold possível (sem crítico), para mostrar na prévia. */
export function goldRange(input: Omit<RewardInput, 'random'>): [number, number] {
  return [goldFor(input, 1 - GOLD_VARIANCE, false), goldFor(input, 1 + GOLD_VARIANCE, false)];
}

// ---------------------------------------------------------------------------
// Níveis
// ---------------------------------------------------------------------------

/** XP total acumulado para *chegar* ao nível dado (nível 1 = 0). */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let n = 1; n < Math.min(level, MAX_LEVEL); n++) total += xpToNextLevel(n);
  return total;
}

/** Converte XP total em nível + XP dentro do nível (limitado ao nível 99). */
export function levelFromTotalXp(totalXp: number): { level: number; xp: number } {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalXp));
  while (level < MAX_LEVEL && rest >= xpToNextLevel(level)) {
    rest -= xpToNextLevel(level);
    level++;
  }
  if (level === MAX_LEVEL) rest = Math.min(rest, xpToNextLevel(MAX_LEVEL) - 1);
  return { level, xp: rest };
}

export interface ProgressState {
  level: number;
  xp: number;
  hp: number;
  mp: number;
  gold: number;
  unspentPoints: number;
}

/** O que mudou ao aplicar uma recompensa — guardado no log para poder desfazer. */
export interface ProgressDelta {
  xp: number;
  gold: number;
  levelsGained: number;
  /** HP/MP recuperados pelo level up. */
  hpHealed: number;
  mpHealed: number;
  pointsGained: number;
}

/** Aplica XP e Gold. Subir de nível recupera HP/MP e dá pontos de atributo. */
export function applyReward(state: ProgressState, xp: number, gold: number): { state: ProgressState; delta: ProgressDelta } {
  const before = totalXpForLevel(state.level) + state.xp;
  const { level, xp: levelXp } = levelFromTotalXp(before + xp);
  const gainedXp = totalXpForLevel(level) + levelXp - before;
  const levelsGained = level - state.level;
  const hp = levelsGained > 0 ? maxHp(level) : state.hp;
  const mp = levelsGained > 0 ? maxMp(level) : state.mp;
  const pointsGained = levelsGained * POINTS_PER_LEVEL;
  const next: ProgressState = {
    level,
    xp: levelXp,
    hp,
    mp,
    gold: state.gold + gold,
    unspentPoints: state.unspentPoints + pointsGained,
  };
  return {
    state: next,
    delta: { xp: gainedXp, gold, levelsGained, hpHealed: hp - state.hp, mpHealed: mp - state.mp, pointsGained },
  };
}

/** Desfaz um `applyReward` a partir do delta registrado. */
export function revertReward(state: ProgressState, delta: ProgressDelta): ProgressState {
  const total = totalXpForLevel(state.level) + state.xp - delta.xp;
  const { level, xp } = levelFromTotalXp(total);
  const lostLevels = state.level - level;
  // HP/MP curados pelo level up desta recompensa voltam; pontos seguem os níveis realmente perdidos.
  const healed = delta.levelsGained > 0;
  return {
    level,
    xp,
    hp: Math.max(1, Math.min(maxHp(level), state.hp - (healed ? delta.hpHealed : 0))),
    mp: Math.max(0, Math.min(maxMp(level), state.mp - (healed ? delta.mpHealed : 0))),
    gold: Math.max(0, state.gold - delta.gold),
    unspentPoints: Math.max(0, state.unspentPoints - lostLevels * POINTS_PER_LEVEL),
  };
}
