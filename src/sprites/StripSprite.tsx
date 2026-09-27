import type { CSSProperties } from 'react';
import { useReducedMotion } from '@/ui/useReducedMotion';

export interface StripSpriteProps {
  /** Tira horizontal de quadros do mesmo tamanho. */
  src: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  scale?: number;
  /** Duração de uma volta completa (s). */
  duration?: number;
  /** `loop` repete; `hold` toca uma vez e para no último quadro. */
  mode?: 'loop' | 'hold';
  /** Sem animação: mostra só este quadro. */
  still?: boolean;
  className?: string;
}

/** Sprite animado a partir de uma tira de quadros (pixel art ampliada sem suavização). */
export function StripSprite({ src, frames, frameWidth, frameHeight, scale = 2, duration = 0.8, mode = 'loop', still, className }: StripSpriteProps) {
  const reduced = useReducedMotion();
  const w = frameWidth * scale;
  const h = frameHeight * scale;
  const moving = !still && !reduced && frames > 1;
  const style: CSSProperties & Record<'--strip-w', string> = {
    width: w,
    height: h,
    backgroundImage: `url(${src})`,
    backgroundSize: `${w * frames}px ${h}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    backgroundPositionX: !moving && mode === 'hold' ? -w * (frames - 1) : 0,
    '--strip-w': `${mode === 'hold' ? -w * (frames - 1) : -w * frames}px`,
    animation: moving
      ? mode === 'loop'
        ? `boss-strip ${duration}s steps(${frames}) infinite`
        : `boss-strip ${duration}s steps(${frames - 1}, jump-end) 1 forwards`
      : undefined,
  };
  return <span aria-hidden className={['inline-block shrink-0', className].filter(Boolean).join(' ')} style={style} />;
}
