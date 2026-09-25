import { palette } from './palette';
import { PixelIcon } from './PixelIcon';

// Mãozinha apontando para a direita (arte original).
const HAND = [
  '....#######.',
  '...#WWWWWWW#',
  '#.#WWW######',
  '##WWWWW#....',
  'S#WWWWWW#...',
  'S#WWWW###...',
  'S#WWWWWW#...',
  '##WWWWW#....',
  '#..#####....',
] as const;

const HAND_COLORS = { '#': palette.ink, W: palette.white, S: palette.sky };

export interface CursorProps {
  className?: string;
}

/** Cursor de "mãozinha" que oscila ao lado do item focado. */
export function Cursor({ className }: CursorProps) {
  return (
    <span className={['px-cursor', className].filter(Boolean).join(' ')} aria-hidden>
      <PixelIcon matrix={HAND} colors={HAND_COLORS} scale={2} />
    </span>
  );
}

/** Espaço reservado à esquerda de botões/itens onde o cursor aparece. */
export function CursorSlot({ visible }: { visible: boolean }) {
  return <span className="px-cursor-slot">{visible ? <Cursor /> : null}</span>;
}
