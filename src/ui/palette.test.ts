import { describe, expect, it } from 'vitest';
import { themeIds, themes, themeToCssVars } from './palette';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('temas de janela', () => {
  it.each(themeIds)('%s tem contraste AA (≥ 4.5) para texto sobre todo o gradiente', (id) => {
    const theme = themes[id];
    for (const bg of [theme.winTop, theme.winBottom]) {
      for (const fg of [theme.text, theme.textDim, theme.accent]) {
        expect(contrast(fg, bg), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('gera todas as variáveis CSS', () => {
    const vars = themeToCssVars(themes.classic);
    expect(Object.keys(vars)).toHaveLength(10);
    expect(vars['--win-top']).toBe('#3a4fb8');
    expect(vars['--win-bottom']).toBe('#10186b');
  });
});
