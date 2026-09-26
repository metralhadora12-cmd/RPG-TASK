import { POINTS_PER_LEVEL } from '@/features/progression/formulas';
import type { StatKey } from '@/features/character/stats';
import { classBaseStats } from '@/sprites/characterParts';
import { gameDayKey } from '@/lib/date';
import type { Appearance, ClassId } from './types';
import type { StoreGet, StoreSet } from './useGameStore';

export const NAME_MAX_LENGTH = 12;
export const REINCARNATION_LEVEL = 10;

export interface CharacterActions {
  /** Cria (ou recria) o herói mantendo a progressão já obtida. */
  createCharacter: (input: { name: string; classId: ClassId; appearance: Appearance }) => void;
  /** Muda nome e aparência (grátis). A classe não muda aqui. */
  updateAppearance: (input: { name?: string; appearance: Appearance }) => void;
  allocatePoint: (stat: StatKey) => boolean;
  /** Troca de classe a partir do nível 10: atributos voltam à base e os pontos ficam livres. */
  reincarnate: (classId: ClassId) => boolean;
}

export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, NAME_MAX_LENGTH);
}

export function createCharacterActions(set: StoreSet, get: StoreGet): CharacterActions {
  return {
    createCharacter: ({ name, classId, appearance }) => {
      const clean = cleanName(name);
      if (!clean) return;
      set((s) => ({
        character: {
          ...s.character,
          name: clean,
          classId,
          appearance: { ...appearance },
          stats: { ...classBaseStats[classId] },
          unspentPoints: (s.character.level - 1) * POINTS_PER_LEVEL,
          // Dias antes do herói existir não contam para as rotinas.
          lastDayProcessed: gameDayKey(new Date(), s.settings.dayStartHour),
        },
      }));
    },

    updateAppearance: ({ name, appearance }) =>
      set((s) => ({
        character: {
          ...s.character,
          name: name !== undefined && cleanName(name) ? cleanName(name) : s.character.name,
          appearance: { ...appearance },
        },
      })),

    allocatePoint: (stat) => {
      if (get().character.unspentPoints <= 0) return false;
      set((s) => ({
        character: {
          ...s.character,
          unspentPoints: s.character.unspentPoints - 1,
          stats: { ...s.character.stats, [stat]: s.character.stats[stat] + 1 },
        },
      }));
      return true;
    },

    reincarnate: (classId) => {
      const { character } = get();
      if (character.level < REINCARNATION_LEVEL || character.classId === classId) return false;
      set((s) => ({
        character: {
          ...s.character,
          classId,
          stats: { ...classBaseStats[classId] },
          unspentPoints: (s.character.level - 1) * POINTS_PER_LEVEL,
        },
      }));
      return true;
    },
  };
}
