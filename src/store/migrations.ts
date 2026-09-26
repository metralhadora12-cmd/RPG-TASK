import { defaultSettings } from './defaults';
import { defaultCharacter, defaultLifetime } from '@/features/character/defaults';
import { inboxList } from './listActions';
import { themeItemId } from '@/features/shop/catalog';
import type { Character, Settings, Task, TaskList } from './types';
import type { PersistedState } from './useGameStore';

/**
 * Versão atual do estado persistido. Ao mudar o formato do estado:
 * incremente, adicione um passo em `steps` e um teste em `migrations.test.ts`.
 */
export const STORE_VERSION = 7;

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
  // v1 → v2: preferências de ordenação por visão e lista padrão "Tarefas".
  1: (state) => {
    const lists = (state.lists as TaskList[] | undefined) ?? [];
    const inbox = inboxList();
    return {
      ...state,
      viewPrefs: state.viewPrefs ?? {},
      lists: lists.some((l) => l.id === inbox.id) ? lists : [inbox, ...lists],
    };
  },
  // v2 → v3: personagem sempre presente (progressão) e contadores vitalícios.
  2: (state) => ({
    ...state,
    character: state.character ?? defaultCharacter(),
    lifetime: { ...defaultLifetime(), ...(state.lifetime as object | undefined) },
  }),
  // v3 → v4: rotinas com recorrência padrão, hábitos com direção, avisos pendentes.
  3: (state) => ({
    ...state,
    tasks: ((state.tasks as Task[] | undefined) ?? []).map((task) => ({
      ...task,
      recurrence: task.kind === 'daily' ? (task.recurrence ?? { type: 'daily' }) : task.recurrence,
      habitDirection: task.kind === 'habit' ? (task.habitDirection ?? 'both') : task.habitDirection,
    })),
    pendingReport: state.pendingReport ?? null,
    pendingFaint: state.pendingFaint ?? null,
  }),
  // v4 → v5: loja. Contadores de compras e o tema já escolhido vira item do inventário.
  4: (state) => {
    const settings = { ...defaultSettings, ...(state.settings as object | undefined) } as Settings;
    const character = state.character as Character | null | undefined;
    const themeItem = themeItemId(settings.theme);
    const grantTheme = character && themeItem && !character.inventory.some((i) => i.itemId === themeItem);
    return {
      ...state,
      lifetime: { ...defaultLifetime(), ...(state.lifetime as object | undefined) },
      character:
        character && grantTheme
          ? {
              ...character,
              inventory: [...character.inventory, { itemId: themeItem, qty: 1 }],
              equipped: { ...character.equipped, theme: themeItem },
            }
          : character,
    };
  },
  // v5 → v6: conquistas (novos contadores) e onboarding (quem já jogava não precisa ver).
  5: (state) => ({
    ...state,
    lifetime: { ...defaultLifetime(), ...(state.lifetime as object | undefined) },
    onboardingDone: state.onboardingDone ?? Boolean((state.character as Character | null | undefined)?.name),
  }),
  // v6 → v7: chefe da semana (aparece na próxima visita) e contador de chefes derrotados.
  6: (state) => ({
    ...state,
    boss: state.boss ?? null,
    lifetime: { ...defaultLifetime(), ...(state.lifetime as object | undefined) },
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
