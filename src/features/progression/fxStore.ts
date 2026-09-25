import { create } from 'zustand';
import { createId } from '@/lib/id';

export type FloatKind = 'xp' | 'gold' | 'critical' | 'damage' | 'heal' | 'coin';

export interface FloatingNumber {
  id: string;
  kind: FloatKind;
  text: string;
  x: number;
  y: number;
  /** Atraso (s) para escalonar vários números saindo do mesmo ponto. */
  delay: number;
  /** Deslocamento horizontal final (moedas espalhando). */
  dx?: number;
}

export interface LevelUpInfo {
  fromLevel: number;
  toLevel: number;
  pointsGained: number;
}

interface FxState {
  floats: FloatingNumber[];
  levelUp: LevelUpInfo | null;
  /** Incrementa a cada dano (dispara tremida + flash vermelho). */
  hitKey: number;
}

/** Efeitos visuais passageiros (não persistidos). */
export const useFxStore = create<FxState>(() => ({ floats: [], levelUp: null, hitKey: 0 }));

/** Tremida da tela e flash vermelho ao sofrer dano. */
export function hitScreen(): void {
  useFxStore.setState((s) => ({ hitKey: s.hitKey + 1 }));
}

/** Ponto de origem dos números flutuantes a partir de um elemento (ou o centro da tela). */
export function originOf(el?: Element | null): { x: number; y: number } {
  const rect = el?.getBoundingClientRect();
  return rect ? { x: rect.left + rect.width / 2, y: rect.top } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

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

/** Chuva de moedas saindo de um ponto (compras). */
export function spawnCoins(origin: { x: number; y: number }, count = 8): void {
  const coins = Array.from({ length: count }, (_, i) => ({
    id: createId(),
    kind: 'coin' as const,
    text: '●',
    x: origin.x,
    y: origin.y,
    delay: i * 0.03,
    dx: Math.round((i - (count - 1) / 2) * 14 + (Math.random() - 0.5) * 10),
  }));
  useFxStore.setState((s) => ({ floats: [...s.floats, ...coins].slice(-30) }));
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
