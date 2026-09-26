import { HERO, SPRITE_SIZE, type LayerSource } from './types';

const HALF = SPRITE_SIZE / 2;
const EMPTY_ROW = '.'.repeat(SPRITE_SIZE);
const cache = new WeakMap<LayerSource, readonly string[]>();

/** Expande uma camada (espelhando `half` e completando linhas/colunas) para 64×64. */
export function expandLayer(source: LayerSource): readonly string[] {
  const cached = cache.get(source);
  if (cached) return cached;
  const rows = source.half
    ? source.half.map((r) => {
        const left = r.padEnd(HALF, '.').slice(0, HALF);
        return left + [...left].reverse().join('');
      })
    : (source.rows ?? []).map((r) => r.padEnd(SPRITE_SIZE, '.').slice(0, SPRITE_SIZE));
  while (rows.length < SPRITE_SIZE) rows.push(EMPTY_ROW);
  cache.set(source, rows);
  return rows;
}

/**
 * Silhueta robusta: do ombro para baixo duplica as duas colunas centrais (+2px por passe).
 * As duas primeiras linhas recebem um passe só, para o ombro não "quebrar" num degrau.
 * Nas pernas o centro é vazio, então elas ficam mais afastadas, como numa postura mais firme.
 */
export function widenRows(rows: readonly string[], startRow: number = HERO.widenRow, passes = 2): string[] {
  return rows.map((r, y) => {
    const n = y < startRow ? 0 : y < startRow + 2 ? Math.min(1, passes) : passes;
    let out = r;
    for (let p = 0; p < n; p++) out = out.slice(1, HALF) + out[HALF - 1]! + out[HALF]! + out.slice(HALF, SPRITE_SIZE - 1);
    return out;
  });
}

/** Desloca a camada inteira na horizontal (dx > 0 para a direita). */
export function shiftRows(rows: readonly string[], dx: number): string[] {
  if (dx === 0) return [...rows];
  const pad = '.'.repeat(Math.abs(dx));
  return rows.map((r) => (dx > 0 ? pad + r.slice(0, SPRITE_SIZE - dx) : r.slice(-dx) + pad));
}

/** Respiração do idle: desce 1px tudo acima da cintura (a linha `waistRow`, lisa em todas as roupas, some). */
export function breatheRows(rows: readonly string[], waistRow: number = HERO.waistRow): string[] {
  return rows.map((r, y) => {
    if (y > waistRow) return r;
    return y === 0 ? EMPTY_ROW : rows[y - 1]!;
  });
}
