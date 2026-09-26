import { useMemo } from 'react';
import type { PaletteLayer } from './types';
import { paintLayers } from './compose';
import { SpriteCanvas } from './SpriteCanvas';
import { HERO_ART, HERO_ART_HEIGHT } from './heroArt';
import { useReducedMotion } from '@/ui/useReducedMotion';
import type { ClassId } from '@/store/types';

export type HeroPose = 'idle' | 'victory' | 'fainted';

export interface HeroArtProps {
  classId: ClassId;
  pose?: HeroPose;
  /** Escala na unidade antiga dos sprites (1 = 64px de altura). */
  scale?: number;
  /** Mostra só o busto (retrato do HUD). */
  bust?: boolean;
  /** Mascote equipado (camada 64×64 do item), desenhado ao lado do herói. */
  pet?: PaletteLayer;
  animate?: boolean;
  label?: string;
  className?: string;
}

function petArt(layer: PaletteLayer) {
  let x0 = 64, x1 = 0, y0 = 64, y1 = 0;
  layer.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1);
    }
  });
  return { grid: paintLayers([layer]), crop: { x: [x0, x1] as [number, number], y: [y0, y1] as [number, number] } };
}

/** O herói da classe (arte fixa), com respiração, vitória, desmaio e mascote. */
export function HeroArt({ classId, pose = 'idle', scale = 3, bust = false, pet, animate = true, label, className }: HeroArtProps) {
  const reduced = useReducedMotion();
  const art = HERO_ART[classId];
  const height = Math.round(64 * scale);
  const k = height / HERO_ART_HEIGHT;
  const width = Math.round(art.width * k);
  const petGrid = useMemo(() => (pet ? petArt(pet) : null), [pet]);
  const moving = animate && !reduced;

  const img = (style: React.CSSProperties = {}, cls = '') => (
    <img
      src={art.src}
      alt=""
      draggable={false}
      width={width}
      height={height}
      className={cls}
      style={{ imageRendering: 'pixelated', width, height, maxWidth: 'none', ...style }}
    />
  );

  if (bust) {
    const box = Math.round(28 * scale);
    const big = box * 2.3;
    const w = (art.width * big) / HERO_ART_HEIGHT;
    return (
      <span
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={['relative inline-block overflow-hidden', className].filter(Boolean).join(' ')}
        style={{ width: box, height: box }}
      >
        <img
          src={art.src}
          alt=""
          draggable={false}
          style={{ imageRendering: 'pixelated', position: 'absolute', height: big, width: w, maxWidth: 'none', left: (box - w) / 2, top: -box * 0.08 }}
        />
      </span>
    );
  }

  const petNode = petGrid ? (
    <span className="self-end" style={{ marginLeft: -Math.round(scale * 2) }}>
      <SpriteCanvas grid={petGrid.grid} crop={petGrid.crop} scale={Math.max(1, Math.round(scale))} />
    </span>
  ) : null;

  const body =
    pose === 'fainted' ? (
      <span className="relative inline-block" style={{ width: height, height: width }}>
        {img({ position: 'absolute', left: 0, top: 0, transformOrigin: 'top left', transform: `translateY(${width}px) rotate(-90deg)` })}
      </span>
    ) : (
      img({}, moving ? (pose === 'victory' ? 'hero-hop' : 'hero-breathe') : '')
    );

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={['inline-flex items-end', className].filter(Boolean).join(' ')}
    >
      {body}
      {petNode}
    </span>
  );
}
