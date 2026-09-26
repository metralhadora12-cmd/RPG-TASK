import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { BG_HEIGHT, drawBackground, type BackgroundId } from './backgrounds';

export interface BackgroundCanvasProps {
  id: BackgroundId;
  /** Largura em px de tela. */
  width: number;
  scale: number;
  animate?: boolean;
  className?: string;
}

const FPS = 8;

/** Cenário pixelado com paralaxe leve (parado com movimento reduzido). */
export function BackgroundCanvas({ id, width, scale, animate = true, className }: BackgroundCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const height = BG_HEIGHT * scale;

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    let t = 0;
    drawBackground(ctx, id, scale, t, width);
    if (!animate || reduced) return;
    const timer = window.setInterval(() => {
      t += 1;
      drawBackground(ctx, id, scale, t, width);
    }, 1000 / FPS);
    return () => window.clearInterval(timer);
  }, [id, scale, width, animate, reduced]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      aria-hidden
      className={className}
      style={{ width, height, imageRendering: 'pixelated' }}
    />
  );
}
