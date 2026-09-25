import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultSettings } from './defaults';
import { createListActions, inboxList, type ListActions } from './listActions';
import { migrate, STORE_VERSION } from './migrations';
import { idbStorage } from './storage';
import { createTaskActions, type TaskActions } from './taskActions';
import type { Character, ListGroup, RewardEvent, Settings, SortMode, Task, TaskList } from './types';

export const STORE_KEY = 'questlog-save';

export interface PersistedState {
  settings: Settings;
  character: Character | null;
  lists: TaskList[];
  groups: ListGroup[];
  tasks: Task[];
  rewardLog: RewardEvent[];
  /** Ordenação escolhida por visão ("my-day", "list:<id>", ...). */
  viewPrefs: Record<string, SortMode>;
}

export interface GameState extends PersistedState, TaskActions, ListActions {
  /** Verdadeiro após carregar o save do IndexedDB. */
  hydrated: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void;
}

export type StoreSet = (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => void;
export type StoreGet = () => GameState;

export function initialPersistedState(): PersistedState {
  return {
    settings: { ...defaultSettings },
    character: null,
    lists: [inboxList()],
    groups: [],
    tasks: [],
    rewardLog: [],
    viewPrefs: {},
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialPersistedState(),
      hydrated: false,
      ...createTaskActions(set, get),
      ...createListActions(set, get),
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
      partialize: ({ settings, character, lists, groups, tasks, rewardLog, viewPrefs }): PersistedState => ({
        settings,
        character,
        lists,
        groups,
        tasks,
        rewardLog,
        viewPrefs,
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
