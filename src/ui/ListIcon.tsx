import { isListIconId, listIcons } from '@/sprites/listIcons';
import { palette } from './palette';
import { PixelIcon } from './PixelIcon';

export interface ListIconProps {
  icon: string;
  color: string;
  scale?: number;
  className?: string;
  title?: string;
}

/** Ícone pixel de lista, recolorido com a cor escolhida. */
export function ListIcon({ icon, color, scale = 2, className, title }: ListIconProps) {
  const matrix = listIcons[isListIconId(icon) ? icon : 'scroll'];
  return (
    <PixelIcon
      matrix={matrix}
      colors={{ '#': palette.ink, c: color, w: palette.white }}
      scale={scale}
      className={className}
      title={title}
    />
  );
}
