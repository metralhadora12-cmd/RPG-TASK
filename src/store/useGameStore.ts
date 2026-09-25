import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultSettings } from './defaults';
import { migrate, STORE_VERSION } from './migrations';
import { idbStorage } from './storage';
import type { Character, ListGroup, RewardEvent, Settings, Task, TaskList } from './types';

export const STORE_KEY = 'questlog-save';

export interface PersistedState {
  settings: Settings;
  character: Character | null;
  lists: TaskList[];
  groups: ListGroup[];
  tasks: Task[];
  rewardLog: RewardEvent[];
}

export interface GameState extends PersistedState {
  /** Verdadeiro após carregar o save do IndexedDB. */
  hydrated: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void;
}

export function initialPersistedState(): PersistedState {
  return {
    settings: { ...defaultSettings },
    character: null,
    lists: [],
    groups: [],
    tasks: [],
    rewardLog: [],
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...initialPersistedState(),
      hydrated: false,
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetProgress: () =>
        set((s) => ({
          ...initialPersistedState(),
          // Preferências de acessibilidade/áudio sobrevivem ao reset.
          settings: s.settings,
        })),
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => idbStorage),
      migrate,
      partialize: ({ settings, character, lists, groups, tasks, rewardLog }): PersistedState => ({
        settings,
        character,
        lists,
        groups,
        tasks,
        rewardLog,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...p.settings },
        };
      },
      onRehydrateStorage: () => () => {
        useGameStore.setState({ hydrated: true });
      },
    },
  ),
);
