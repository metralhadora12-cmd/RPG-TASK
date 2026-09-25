import { describe, expect, it } from 'vitest';
import { maxHp, maxMp, xpToNextLevel } from './formulas';

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
