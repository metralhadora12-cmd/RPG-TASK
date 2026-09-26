import { useMemo } from 'react';
import { HeroArt, type HeroPose } from '@/sprites/HeroArt';
import { useGameStore } from '@/store/useGameStore';
import { equipmentFor, type Equipped } from './equipment';

export interface HeroSpriteProps {
  pose?: HeroPose;
  scale?: number;
  /** Só o busto (retrato do HUD). */
  bust?: boolean;
  /** Equipamento alternativo (prévia de compra). */
  equipped?: Equipped;
  label?: string;
  animate?: boolean;
}

/** O herói do jogador: a arte da classe, com o mascote equipado ao lado. */
export function HeroSprite({ equipped, ...props }: HeroSpriteProps) {
  const classId = useGameStore((s) => s.character.classId);
  const current = useGameStore((s) => s.character.equipped);
  const eq = equipped ?? current;
  const pet = useMemo(() => equipmentFor({ pet: eq.pet }).layers?.pet?.[0], [eq.pet]);
  return <HeroArt classId={classId} pet={props.bust ? undefined : pet} {...props} />;
}
