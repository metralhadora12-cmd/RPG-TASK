/**
 * Cenários desenhados proceduralmente em canvas (pixel art original).
 * Cada cenário tem faixas de céu e camadas com paralaxe (quanto mais perto, mais rápido).
 */
export type BackgroundId = 'village' | 'forest' | 'mountain' | 'castle' | 'night';
export const backgroundIds: BackgroundId[] = ['village', 'forest', 'mountain', 'castle', 'night'];

/** Largura do cenário em "pixels" de arte (repete horizontalmente). */
export const BG_WIDTH = 64;
export const BG_HEIGHT = 40;

/** Gera números pseudoaleatórios estáveis a partir de uma semente. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BgLayer {
  /** Velocidade relativa da paralaxe (0 = parado). */
  speed: number;
  /** Altura (em px de arte, a partir do topo) do contorno para cada coluna x. */
  heightAt: (x: number) => number;
  color: string;
  /** Detalhes extras (janelas, estrelas...) desenhados sobre a camada. */
  details?: { x: number; y: number; color: string }[];
}

export interface BackgroundDef {
  sky: string[];
  layers: BgLayer[];
  /** Pontos fixos no céu (estrelas, sol, lua). */
  skyDots?: { x: number; y: number; color: string }[];
}

const wave = (amp: number, freq: number, base: number, phase = 0) => (x: number) =>
  Math.round(base + amp * Math.sin((x / BG_WIDTH) * Math.PI * 2 * freq + phase));

/** Silhueta em degraus (prédios/muralhas) com topo determinístico. */
function blocks(seed: number, minH: number, maxH: number, minW: number, maxW: number) {
  const rand = mulberry32(seed);
  const tops: number[] = [];
  let x = 0;
  while (x < BG_WIDTH) {
    const w = minW + Math.floor(rand() * (maxW - minW + 1));
    const h = minH + Math.floor(rand() * (maxH - minH + 1));
    for (let i = 0; i < w && x < BG_WIDTH; i++, x++) tops.push(h);
  }
  return (col: number) => tops[((col % BG_WIDTH) + BG_WIDTH) % BG_WIDTH]!;
}

/** Copas de árvores pontudas. */
function trees(seed: number, base: number, height: number) {
  const rand = mulberry32(seed);
  const tops: number[] = new Array(BG_WIDTH).fill(base);
  for (let cx = 2; cx < BG_WIDTH; cx += 5 + Math.floor(rand() * 3)) {
    const h = height - Math.floor(rand() * 4);
    for (let dx = -3; dx <= 3; dx++) {
      const col = (cx + dx + BG_WIDTH) % BG_WIDTH;
      tops[col] = Math.min(tops[col]!, base - h + Math.abs(dx) * 2);
    }
  }
  return (col: number) => tops[((col % BG_WIDTH) + BG_WIDTH) % BG_WIDTH]!;
}

function dots(seed: number, count: number, maxY: number, color: string) {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: Math.floor(rand() * BG_WIDTH),
    y: Math.floor(rand() * maxY),
    color,
  }));
}

const flat = (y: number) => () => y;

export const backgrounds: Record<BackgroundId, BackgroundDef> = {
  village: {
    sky: ['#78b8f8', '#98c8f8', '#b8d8f8'],
    skyDots: [
      { x: 50, y: 5, color: '#f8f0a0' },
      { x: 51, y: 5, color: '#f8f0a0' },
      { x: 50, y: 6, color: '#f8f0a0' },
      { x: 51, y: 6, color: '#f8f0a0' },
    ],
    layers: [
      { speed: 0.1, heightAt: wave(3, 2, 22), color: '#88b878' },
      { speed: 0.3, heightAt: blocks(7, 18, 26, 4, 7), color: '#b87850', details: dots(9, 10, 30, '#f8e070').map((d) => ({ ...d, y: 24 + (d.y % 5) })) },
      { speed: 0.6, heightAt: flat(33), color: '#58a048' },
    ],
  },
  forest: {
    sky: ['#a8d8a8', '#c0e0b0', '#d8e8c0'],
    layers: [
      { speed: 0.1, heightAt: trees(3, 26, 12), color: '#4a8a58' },
      { speed: 0.3, heightAt: trees(5, 30, 14), color: '#2e6a3a' },
      { speed: 0.6, heightAt: flat(34), color: '#3a5a28' },
    ],
  },
  mountain: {
    sky: ['#5878c8', '#7898d8', '#a8c0e8'],
    layers: [
      { speed: 0.05, heightAt: (x) => 10 + Math.abs(((x * 3) % 40) - 20), color: '#8890b8' },
      { speed: 0.2, heightAt: (x) => 18 + Math.abs(((x * 2 + 11) % 32) - 16) / 2, color: '#586890' },
      { speed: 0.5, heightAt: wave(2, 3, 32), color: '#487040' },
    ],
  },
  castle: {
    sky: ['#e89868', '#f0b880', '#f8d8a0'],
    layers: [
      { speed: 0.08, heightAt: wave(2, 1, 26), color: '#a86868' },
      {
        speed: 0.25,
        // Muralha com ameias e duas torres.
        heightAt: (x) => {
          const m = ((x % BG_WIDTH) + BG_WIDTH) % BG_WIDTH;
          if ((m >= 10 && m < 16) || (m >= 40 && m < 46)) return m % 2 === 0 ? 8 : 10;
          return m % 2 === 0 ? 20 : 22;
        },
        color: '#685060',
        details: [11, 13, 41, 43].flatMap((x) => [
          { x, y: 14, color: '#f8d870' },
          { x, y: 15, color: '#f8d870' },
        ]),
      },
      { speed: 0.6, heightAt: flat(34), color: '#586838' },
    ],
  },
  night: {
    sky: ['#080828', '#101840', '#182858'],
    skyDots: [
      ...dots(11, 26, 22, '#f8f8f8'),
      ...dots(12, 8, 22, '#a8c8ff'),
      { x: 44, y: 4, color: '#f8f0d0' },
      { x: 45, y: 4, color: '#f8f0d0' },
      { x: 44, y: 5, color: '#f8f0d0' },
      { x: 45, y: 5, color: '#e0d8b0' },
    ],
    layers: [
      { speed: 0.1, heightAt: wave(4, 2, 26), color: '#202848' },
      { speed: 0.3, heightAt: trees(21, 32, 10), color: '#101830' },
      { speed: 0.6, heightAt: flat(35), color: '#182018' },
    ],
  },
};

/** Desenha o cenário num contexto 2D com deslocamento de paralaxe `t` (em px de arte). */
export function drawBackground(ctx: CanvasRenderingContext2D, id: BackgroundId, scale: number, t: number, width: number) {
  const def = backgrounds[id];
  const cols = Math.ceil(width / scale);
  const band = Math.ceil(BG_HEIGHT / def.sky.length);
  def.sky.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * band * scale, width, band * scale);
  });
  for (const dot of def.skyDots ?? []) {
    ctx.fillStyle = dot.color;
    for (let rep = 0; rep * BG_WIDTH < cols + BG_WIDTH; rep++) ctx.fillRect((dot.x + rep * BG_WIDTH) * scale, dot.y * scale, scale, scale);
  }
  for (const layer of def.layers) {
    const offset = Math.floor(t * layer.speed);
    ctx.fillStyle = layer.color;
    for (let x = 0; x < cols; x++) {
      const top = layer.heightAt(x + offset);
      ctx.fillRect(x * scale, top * scale, scale, (BG_HEIGHT - top) * scale);
    }
    for (const d of layer.details ?? []) {
      ctx.fillStyle = d.color;
      let sx = (((d.x - offset) % BG_WIDTH) + BG_WIDTH) % BG_WIDTH;
      for (; sx < cols; sx += BG_WIDTH) ctx.fillRect(sx * scale, d.y * scale, scale, scale);
    }
  }
}
