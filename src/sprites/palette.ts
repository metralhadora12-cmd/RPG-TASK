import type { SpritePalette } from './types';

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function toHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max;
  if (max === min) return [0, 0, v];
  const s = (max - min) / max;
  const rc = (max - r) / (max - min);
  const gc = (max - g) / (max - min);
  const bc = (max - b) / (max - min);
  let h = r === max ? bc - gc : g === max ? 2 + rc - bc : 4 + gc - rc;
  h = (((h / 6) % 1) + 1) % 1;
  return [h, s, v];
}

function fromHsv(h: number, s: number, v: number): string {
  h = ((h % 1) + 1) % 1;
  s = clamp01(s);
  v = clamp01(v);
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));
  const [r, g, b] = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ][i % 6]!;
  return `#${[r, g, b].map((c) => Math.round(c! * 255).toString(16).padStart(2, '0')).join('')}`;
}

/** Aproxima a matiz `h` de `target` em no máximo `amount` (pelo caminho mais curto do círculo). */
function toward(h: number, target: number, amount: number): number {
  const d = ((((target - h + 0.5) % 1) + 1) % 1) - 0.5;
  return h + Math.max(-amount, Math.min(amount, d));
}

/**
 * Um passo de rampa de cor, como nos sprites de 32 bits: sombras puxam a matiz para o
 * vermelho/roxo e ganham saturação; luzes puxam para o amarelo. `steps` < 0 escurece.
 */
export function tone(color: string, steps: number): string {
  if (steps === 0) return color;
  const [h, s, v] = toHsv(color);
  const gray = s < 0.12;
  const k = Math.abs(steps);
  if (steps < 0) {
    return fromHsv(gray ? 0.7 : toward(h, 0.75, 0.025 * k), s + (gray ? 0.04 : 0.1) * k, v * 0.76 ** k);
  }
  return fromHsv(gray ? h : toward(h, 0.15, 0.02 * k), s - 0.1 * k, v + (1 - v) * 0.38 * k + 0.04 * k);
}

/**
 * Tons derivados: cada material tem luz · base · sombra · sombra profunda.
 * As paletas escritas à mão definem só a base (e às vezes a sombra); o resto vem daqui.
 *
 *   pele t s S u · cabelo L l h H k · olhos E e i
 *   roupa f c C d · detalhe g a A z · calça q p P Q · couro j b B N · metal w m M n · manga y v V Y
 */
const rules: [key: string, from: string[], steps: number][] = [
  ['S', ['s'], -1],
  ['t', ['s'], 0.8],
  ['u', ['S', 's'], -1],
  ['H', ['h'], -1],
  ['l', ['h'], 1],
  ['L', ['l', 'h'], 1],
  ['k', ['H', 'h'], -1],
  ['E', ['e'], -1.5],
  ['i', ['e'], 1.6],
  ['C', ['c'], -1],
  ['f', ['c'], 1],
  ['d', ['C', 'c'], -1],
  ['A', ['a'], -1],
  ['g', ['a'], 1],
  ['z', ['A', 'a'], -1],
  ['P', ['p'], -1],
  ['q', ['p'], 1],
  ['Q', ['P', 'p'], -1],
  ['B', ['b'], -1],
  ['j', ['b'], 1],
  ['N', ['B', 'b'], -1],
  ['M', ['m'], -1],
  ['w', ['m'], 1.6],
  ['n', ['M', 'm'], -1],
  ['V', ['v'], -1],
  ['y', ['v'], 1],
  ['Y', ['V', 'v'], -1],
];

const cache = new WeakMap<SpritePalette, SpritePalette>();

/** Completa uma paleta com os tons derivados que faltam (o resultado é memorizado). */
export function derive(palette: SpritePalette): SpritePalette {
  const cached = cache.get(palette);
  if (cached) return cached;
  const out: Record<string, string> = { W: '#ffffff', ...palette };
  for (const [key, from, steps] of rules) {
    if (out[key]) continue;
    const source = from.find((k) => out[k]);
    if (source) out[key] = tone(out[source]!, steps);
  }
  out.w ??= '#f8f8f8';
  cache.set(palette, out);
  return out;
}
