import { defaultSettings } from './defaults';
import type { PersistedState } from './useGameStore';

/**
 * Versão atual do estado persistido. Ao mudar o formato do estado:
 * incremente, adicione um passo em `steps` e um teste em `migrations.test.ts`.
 */
export const STORE_VERSION = 1;

type Step = (state: Record<string, unknown>) => Record<string, unknown>;

/** `steps[n]` converte um estado da versão `n` para `n + 1`. */
const steps: Record<number, Step> = {
  // v0 → v1: estado inicial; garante todas as coleções e configurações.
  0: (state) => ({
    ...state,
    settings: { ...defaultSettings, ...(state.settings as object | undefined) },
    character: state.character ?? null,
    lists: state.lists ?? [],
    groups: state.groups ?? [],
    tasks: state.tasks ?? [],
    rewardLog: state.rewardLog ?? [],
  }),
};

export function migrate(persisted: unknown, fromVersion: number): PersistedState {
  let state = (persisted ?? {}) as Record<string, unknown>;
  for (let v = fromVersion; v < STORE_VERSION; v++) {
    const step = steps[v];
    if (!step) throw new Error(`Migração ausente para a versão ${v}`);
    state = step(state);
  }
  return state as unknown as PersistedState;
}
