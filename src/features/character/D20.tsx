import { useCallback, useEffect, useRef, useState } from 'react';
import { palette } from '@/ui/palette';
import { PixelIcon } from '@/ui/PixelIcon';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { rollD20 } from './random';

// Dado de 20 lados visto de frente (arte original).
const D20_ART = [
  '.....#####.....',
  '...##ddddd##...',
  '..#dddd#dddd#..',
  '.#dddd#l#dddd#.',
  '#dddd#lll#dddd#',
  '#ddd#lllll#ddd#',
  '#dd#lllllll#dd#',
  '#d#lllllllll#d#',
  '##lllllllllll##',
  '#d###########d#',
  '#dd#ddddddd#dd#',
  '.#dd#ddddd#dd#.',
  '..#dd#ddd#dd#..',
  '...##ddddd##...',
  '.....#####.....',
] as const;

const COLORS = { '#': palette.ink, d: palette.rarityEpic, l: '#e8c8ff' };
const ROLL_MS = 700;
const STEPS = 10;

/** Rolagem animada: mostra faces aleatórias por ~0,7s e então o resultado. */
export function useD20Roll(onRoll: (value: number) => void) {
  const reduced = useReducedMotion();
  const [face, setFace] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const roll = useCallback(() => {
    if (rolling) return;
    const result = rollD20();
    if (reduced) {
      setFace(result);
      onRoll(result);
      return;
    }
    setRolling(true);
    for (let i = 0; i < STEPS; i++) {
      timers.current.push(window.setTimeout(() => setFace(rollD20()), (ROLL_MS / STEPS) * i));
    }
    timers.current.push(
      window.setTimeout(() => {
        setFace(result);
        setRolling(false);
        onRoll(result);
      }, ROLL_MS),
    );
  }, [rolling, reduced, onRoll]);

  return { roll, face, rolling };
}

/** Ícone do d20 com o número da face (gira enquanto rola). */
export function D20Face({ face, rolling }: { face: number | null; rolling: boolean }) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{
        transform: rolling ? `rotate(${(face ?? 0) * 72}deg)` : undefined,
        transition: 'transform 70ms steps(2)',
      }}
      aria-hidden
    >
      <PixelIcon matrix={D20_ART} colors={COLORS} scale={2} />
      <span className="absolute text-base leading-none" style={{ top: 12, color: palette.ink }}>
        {face ?? 20}
      </span>
    </span>
  );
}
