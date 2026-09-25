import type { Stats } from '@/store/types';

export const statKeys = ['str', 'int', 'agi', 'vit'] as const satisfies readonly (keyof Stats)[];
export type StatKey = (typeof statKeys)[number];

/** Total de pontos já distribuídos acima dos atributos iniciais. */
export function allocatedPoints(stats: Stats, base: Stats): number {
  return statKeys.reduce((sum, k) => sum + Math.max(0, stats[k] - base[k]), 0);
}

/**
 * Tira `n` pontos distribuídos (usado quando um nível é desfeito e os pontos
 * livres não bastam). Remove sempre do atributo com mais pontos acima da base.
 */
export function removeAllocated(stats: Stats, base: Stats, n: number): Stats {
  const next = { ...stats };
  for (let i = 0; i < n; i++) {
    const key = [...statKeys]
      .filter((k) => next[k] > base[k])
      .sort((a, b) => next[b] - base[b] - (next[a] - base[a]))[0];
    if (!key) break;
    next[key] -= 1;
  }
  return next;
}
