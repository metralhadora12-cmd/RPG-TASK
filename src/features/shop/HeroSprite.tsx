import { useMemo } from 'react';
import { CharacterSprite, type CharacterPose } from '@/sprites/CharacterSprite';
import type { SpriteCanvasProps } from '@/sprites/SpriteCanvas';
import { useGameStore } from '@/store/useGameStore';
import { equipmentFor, type Equipped } from './equipment';

export interface HeroSpriteProps {
  pose?: CharacterPose;
  scale?: number;
  crop?: SpriteCanvasProps['crop'];
  /** Equipamento alternativo (prévia de compra). */
  equipped?: Equipped;
  label?: string;
  animate?: boolean;
}

/** O herói do jogador, já com os itens equipados. */
export function HeroSprite({ equipped, ...props }: HeroSpriteProps) {
  const character = useGameStore((s) => s.character);
  const current = equipped ?? character.equipped;
  const equipment = useMemo(() => equipmentFor(current), [current]);
  return <CharacterSprite look={character} equipment={equipment} {...props} />;
}
