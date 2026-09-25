import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultSettings } from './defaults';
import { createShopActions, type ShopActions } from './shopActions';
import { createDayActions, type DayActions } from './dayActions';
import { createCharacterActions, type CharacterActions } from './characterActions';
import { createListActions, inboxList, type ListActions } from './listActions';
import { migrate, STORE_VERSION } from './migrations';
import { idbStorage } from './storage';
import { createTaskActions, type TaskActions } from './taskActions';
import { defaultCharacter, defaultLifetime } from '@/features/character/defaults';
import type { Character, FaintInfo, LifetimeStats, NightReport, ListGroup, RewardEvent, Settings, SortMode, Task, TaskList } from './types';

export const STORE_KEY = 'questlog-save';

export interface PersistedState {
  settings: Settings;
  character: Character;
  lists: TaskList[];
  groups: ListGroup[];
  tasks: Task[];
  rewardLog: RewardEvent[];
  lifetime: LifetimeStats;
  /** Relatório da noite ainda não visto. */
  pendingReport: NightReport | null;
  /** Tela de desmaio ainda não vista. */
  pendingFaint: FaintInfo | null;
  /** Ordenação escolhida por visão ("my-day", "list:<id>", ...). */
  viewPrefs: Record<string, SortMode>;
}

export interface GameState extends PersistedState, TaskActions, ListActions, CharacterActions, DayActions, ShopActions {
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
    character: defaultCharacter(),
    lists: [inboxList()],
    groups: [],
    tasks: [],
    rewardLog: [],
    lifetime: defaultLifetime(),
    pendingReport: null,
    pendingFaint: null,
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
      ...createCharacterActions(set, get),
      ...createDayActions(set, get),
      ...createShopActions(set, get),
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
      partialize: (s): PersistedState => ({
        settings: s.settings,
        character: s.character,
        lists: s.lists,
        groups: s.groups,
        tasks: s.tasks,
        rewardLog: s.rewardLog,
        lifetime: s.lifetime,
        pendingReport: s.pendingReport,
        pendingFaint: s.pendingFaint,
        viewPrefs: s.viewPrefs,
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
