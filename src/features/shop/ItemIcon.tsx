import { useMemo } from 'react';
import { basePalette, outfitShapes, skinTones } from '@/sprites/characterParts';
import { paintLayers } from '@/sprites/compose';
import { expandLayer } from '@/sprites/layers';
import { SpriteCanvas } from '@/sprites/SpriteCanvas';
import { palette, themes } from '@/ui/palette';
import { PixelIcon } from '@/ui/PixelIcon';
import { BackgroundCanvas } from './BackgroundCanvas';
import type { ShopItem } from './catalog';

const POTION = ['...##...', '...#w#..', '..#ww#..', '.#rrrr#.', '#rwrrrr#', '#rrrrrr#', '#rrrrrr#', '.######.'] as const;

/** Recorta a caixa com pixels de uma grade de camada. */
function bounds(rows: readonly string[]) {
  let x0 = 32, x1 = 0, y0 = 32, y1 = 0;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x + 1);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y + 1);
    }
  });
  return { x: [x0, x1] as [number, number], y: [y0, y1] as [number, number] };
}

/** Ícone do item para a vitrine (a própria arte recortada, uma miniatura ou uma amostra). */
export function ItemIcon({ item, scale = 2 }: { item: ShopItem; scale?: number }) {
  const art = useMemo(() => {
    if ('art' in item) {
      const rows = expandLayer(item.art);
      return { grid: paintLayers([{ rows, palette: { ...basePalette, ...item.palette } }]), crop: bounds(rows) };
    }
    if (item.category === 'armor') {
      const rows = expandLayer(outfitShapes[item.outfit.shape]);
      const grid = paintLayers([{ rows, palette: { ...basePalette, ...skinTones[2]!, ...item.outfit.palette } }]);
      return { grid, crop: bounds(rows) };
    }
    return null;
  }, [item]);

  if (art) return <SpriteCanvas grid={art.grid} scale={scale} crop={art.crop} />;
  if (item.category === 'background') return <BackgroundCanvas id={item.background} width={16 * scale * 3} scale={scale} animate={false} />;
  if (item.category === 'theme') {
    const th = themes[item.theme];
    return (
      <span
        aria-hidden
        className="inline-block size-10 rounded-sm border-2"
        style={{
          background: `linear-gradient(${th.winTop}, ${th.winBottom})`,
          borderColor: th.borderOuter,
          boxShadow: `inset 0 0 0 2px ${th.borderLight}`,
        }}
      />
    );
  }
  return <PixelIcon matrix={POTION} colors={{ '#': palette.ink, w: palette.white, r: palette.hpRed }} scale={scale * 2} />;
}
