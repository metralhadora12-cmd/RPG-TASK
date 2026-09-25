import { SPRITE_SIZE, type LayerSource } from './types';

const EMPTY_ROW = '.'.repeat(SPRITE_SIZE);
const cache = new WeakMap<LayerSource, readonly string[]>();

/** Expande uma camada (espelhando `half` e completando linhas) para 32×32. */
export function expandLayer(source: LayerSource): readonly string[] {
  const cached = cache.get(source);
  if (cached) return cached;
  const rows = source.half
    ? source.half.map((r) => r + [...r].reverse().join(''))
    : [...(source.rows ?? [])];
  while (rows.length < SPRITE_SIZE) rows.push(EMPTY_ROW);
  cache.set(source, rows);
  return rows;
}

/**
 * Silhueta robusta: do ombro para baixo alarga 2px no centro.
 * Nas pernas, onde o centro é contorno, abre um vão transparente (pernas afastadas).
 */
export function widenRows(rows: readonly string[], shoulderRow = 17, hipRow = 25): string[] {
  return rows.map((r, y) => {
    if (y < shoulderRow) return r;
    const left = r.slice(1, 16);
    const right = r.slice(16, 31);
    let a = r[15]!;
    let b = r[16]!;
    if (y >= hipRow && a === 'o' && b === 'o') {
      a = '.';
      b = '.';
    }
    return left + a + b + right;
  });
}

/** Respiração do idle: desce 1px tudo acima do peito (a linha `waistRow`, lisa em todas as roupas, some). */
export function breatheRows(rows: readonly string[], waistRow = 19): string[] {
  return rows.map((r, y) => {
    if (y > waistRow) return r;
    return y === 0 ? EMPTY_ROW : rows[y - 1]!;
  });
}
