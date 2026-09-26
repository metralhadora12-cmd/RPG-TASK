import { useMemo } from 'react';
import { paintLayers } from '@/sprites/compose';
import { SpriteCanvas } from '@/sprites/SpriteCanvas';
import { StripSprite } from '@/sprites/StripSprite';
import type { HeroPose } from '@/sprites/HeroArt';
import { getItem } from './catalog';
import { equipmentFor } from './equipment';
import { PET_ART, PET_FRAME, type PetAnim } from './petArt';

const animFor: Record<HeroPose, PetAnim> = { idle: 'idle', victory: 'victory', fainted: 'sleep' };

/** Mascote equipado: sprite animado (gatos) ou a arte em código dos outros mascotes. */
export function PetSprite({ itemId, pose = 'idle', scale = 3, still }: { itemId: string; pose?: HeroPose; scale?: number; still?: boolean }) {
  const item = getItem(itemId);
  const layer = useMemo(() => equipmentFor({ pet: itemId }).layers?.pet?.[0], [itemId]);
  const grid = useMemo(() => {
    if (!layer) return null;
    let x0 = 64, x1 = 0, y0 = 64, y1 = 0;
    layer.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '.') continue;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1);
      }
    });
    return { grid: paintLayers([layer]), crop: { x: [x0, x1] as [number, number], y: [y0, y1] as [number, number] } };
  }, [layer]);

  if (item?.category === 'pet' && item.sprite) {
    const anim = animFor[pose];
    const { src, frames } = PET_ART[item.sprite][anim];
    return (
      <StripSprite
        src={src}
        frames={frames}
        frameWidth={PET_FRAME.width}
        frameHeight={PET_FRAME.height}
        scale={Math.max(1, Math.round((scale * 2) / 3))}
        duration={anim === 'sleep' ? 1.6 : anim === 'victory' ? 0.6 : 0.9}
        still={still}
      />
    );
  }
  if (!grid) return null;
  return <SpriteCanvas grid={grid.grid} crop={grid.crop} scale={Math.max(1, Math.round(scale))} />;
}
