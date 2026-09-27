import { HeroArt, type HeroPose } from '@/sprites/HeroArt';
import { useGameStore } from '@/store/useGameStore';
import type { Equipped } from './equipment';
import { PetSprite } from './PetSprite';

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
  const petId = (equipped ?? current).pet;
  const pet =
    petId && !props.bust ? (
      <PetSprite itemId={petId} pose={props.pose} scale={props.scale} still={props.animate === false} />
    ) : undefined;
  return <HeroArt classId={classId} pet={pet} {...props} />;
}
