import { useSyncExternalStore } from 'react';
import { useGameStore } from '@/store/useGameStore';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(cb: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/** Verdadeiro quando animações (tremidas, flashes, digitação) devem ser reduzidas. */
export function useReducedMotion(): boolean {
  const pref = useGameStore((s) => s.settings.reducedMotion);
  const system = useSyncExternalStore(subscribe, getSnapshot, () => false);
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return system;
}
