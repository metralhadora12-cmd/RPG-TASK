import { create } from 'zustand';
import { createId } from '@/lib/id';

export type FloatKind = 'xp' | 'gold' | 'critical' | 'damage' | 'heal';

export interface FloatingNumber {
  id: string;
  kind: FloatKind;
  text: string;
  x: number;
  y: number;
  /** Atraso (s) para escalonar vários números saindo do mesmo ponto. */
  delay: number;
}

export interface LevelUpInfo {
  fromLevel: number;
  toLevel: number;
  pointsGained: number;
}

interface FxState {
  floats: FloatingNumber[];
  levelUp: LevelUpInfo | null;
}

/** Efeitos visuais passageiros (não persistidos). */
export const useFxStore = create<FxState>(() => ({ floats: [], levelUp: null }));

export function spawnFloats(origin: { x: number; y: number }, items: { kind: FloatKind; text: string }[]): void {
  const floats = items.map((item, i) => ({
    id: createId(),
    ...item,
    x: origin.x,
    // Empilha em coluna: o primeiro fica em cima.
    y: origin.y - 8 + i * 18,
    delay: i * 0.08,
  }));
  useFxStore.setState((s) => ({ floats: [...s.floats, ...floats].slice(-20) }));
}

export function removeFloat(id: string): void {
  useFxStore.setState((s) => ({ floats: s.floats.filter((f) => f.id !== id) }));
}

/** Enfileira um level up (se já houver um aberto, junta os ganhos). */
export function showLevelUp(info: LevelUpInfo): void {
  useFxStore.setState((s) => ({
    levelUp: s.levelUp
      ? {
          fromLevel: s.levelUp.fromLevel,
          toLevel: info.toLevel,
          pointsGained: s.levelUp.pointsGained + info.pointsGained,
        }
      : info,
  }));
}

export function closeLevelUp(): void {
  useFxStore.setState({ levelUp: null });
}
