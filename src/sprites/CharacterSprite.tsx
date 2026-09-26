import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { composeCharacter, type CharacterLook, type Equipment } from './compose';
import { SpriteCanvas, type SpriteCanvasProps } from './SpriteCanvas';

export type CharacterPose = 'idle' | 'victory' | 'fainted';

export interface CharacterSpriteProps {
  look: CharacterLook;
  pose?: CharacterPose;
  equipment?: Equipment;
  scale?: number;
  crop?: SpriteCanvasProps['crop'];
  /** Anima o idle (2 quadros). Desligado automaticamente com movimento reduzido. */
  animate?: boolean;
  className?: string;
  label?: string;
}

const FRAME_MS = 520;

/** Personagem composto em camadas, com idle de 2 quadros. */
export function CharacterSprite({
  look,
  pose = 'idle',
  equipment,
  scale = 4,
  crop,
  animate = true,
  className,
  label,
}: CharacterSpriteProps) {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState(0);
  const running = animate && !reduced && pose === 'idle';

  useEffect(() => {
    if (!running) {
      setFrame(0);
      return;
    }
    const timer = window.setInterval(() => setFrame((f) => 1 - f), FRAME_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  const { appearance, classId } = look;
  const grids = useMemo(() => {
    const l = { appearance, classId };
    if (pose === 'idle') return [composeCharacter(l, 'idle0', equipment), composeCharacter(l, 'idle1', equipment)];
    return [composeCharacter(l, pose, equipment)];
  }, [appearance, classId, pose, equipment]);

  return <SpriteCanvas grid={grids[frame] ?? grids[0]!} scale={scale} crop={crop} className={className} label={label} />;
}
