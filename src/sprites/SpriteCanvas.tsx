import { useEffect, useRef } from 'react';
import { SPRITE_SIZE, type PixelGrid } from './types';

export interface SpriteCanvasProps {
  grid: PixelGrid;
  /** Escala inteira (cada pixel vira scale×scale). */
  scale?: number;
  /** Recorte [início, fim) em linhas e colunas do sprite (ex.: só o busto no HUD). */
  crop?: { x?: [number, number]; y?: [number, number] };
  className?: string;
  label?: string;
}

/** Desenha uma grade de pixels num <canvas> sem suavização. */
export function SpriteCanvas({ grid, scale = 4, crop, className, label }: SpriteCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [x0, x1] = crop?.x ?? [0, SPRITE_SIZE];
  const [y0, y1] = crop?.y ?? [0, SPRITE_SIZE];
  const width = (x1 - x0) * scale;
  const height = (y1 - y0) * scale;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return; // jsdom/sem canvas: nada a desenhar
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = y0; y < y1; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = x0; x < x1; x++) {
        const color = row[x];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect((x - x0) * scale, (y - y0) * scale, scale, scale);
      }
    }
  }, [grid, scale, x0, x1, y0, y1]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={className}
      style={{ width, height, imageRendering: 'pixelated' }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
