import { initialPersistedState, type GameState } from '@/store/useGameStore';

/** Estado inicial com um herói já criado (para testes de telas internas). */
export function heroState(): Partial<GameState> {
  const state = initialPersistedState();
  return { ...state, character: { ...state.character, name: 'Aria' }, onboardingDone: true, hydrated: true };
}
