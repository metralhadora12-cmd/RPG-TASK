/**
 * Fórmulas do sistema de RPG — funções puras, cobertas por testes.
 * (A fase 3 adiciona recompensas, modificadores e drops.)
 */

export const MAX_LEVEL = 99;
export const BASE_HP = 50;
export const HP_PER_LEVEL = 5;
export const BASE_MP = 20;
export const MP_PER_LEVEL = 2;

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
