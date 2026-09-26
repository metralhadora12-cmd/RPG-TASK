import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultSettings } from './defaults';
import { createShopActions, type ShopActions } from './shopActions';
import { createBossActions, type BossActions } from './bossActions';
import { persistedPart } from './backup';
import { createDayActions, type DayActions } from './dayActions';
import { createCharacterActions, type CharacterActions } from './characterActions';
import { createListActions, inboxList, type ListActions } from './listActions';
import { migrate, STORE_VERSION } from './migrations';
import { idbStorage } from './storage';
import { createTaskActions, type TaskActions } from './taskActions';
import { defaultCharacter, defaultLifetime } from '@/features/character/defaults';
import type { BossState, Character, FaintInfo, LifetimeStats, NightReport, ListGroup, RewardEvent, Settings, SortMode, Task, TaskList } from './types';

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
  /** Onboarding do mentor já visto. */
  onboardingDone: boolean;
  /** Ordenação escolhida por visão ("my-day", "list:<id>", ...). */
  viewPrefs: Record<string, SortMode>;
  /** Chefe da semana (null até a primeira visita/ataque). */
  boss: BossState | null;
}

export interface GameState extends PersistedState, TaskActions, ListActions, CharacterActions, DayActions, ShopActions, BossActions {
  /** Verdadeiro após carregar o save do IndexedDB. */
  hydrated: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  unlockAchievements: (ids: string[]) => void;
  finishOnboarding: () => void;
  /** Substitui todo o progresso por um backup já migrado. */
  importSave: (state: PersistedState) => void;
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
    onboardingDone: false,
    viewPrefs: {},
    boss: null,
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
      ...createBossActions(set, get),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      unlockAchievements: (ids) =>
        set((s) => ({
          character: {
            ...s.character,
            achievements: [...s.character.achievements, ...ids.filter((id) => !s.character.achievements.includes(id))],
          },
        })),
      finishOnboarding: () => set({ onboardingDone: true }),
      importSave: (state) => set({ ...initialPersistedState(), ...state }),
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
      partialize: (s: GameState): PersistedState => persistedPart(s),
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
