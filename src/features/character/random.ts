import { appearanceLimits, classIds } from '@/sprites/characterParts';
import type { Appearance, ClassId } from '@/store/types';

/** Nomes originais para o botão "Aleatório". */
export const heroNames = [
  'Aria', 'Bento', 'Caio', 'Dora', 'Elis', 'Fausto', 'Gaia', 'Heitor', 'Iara', 'Joca', 'Kael', 'Lina',
  'Maru', 'Nilo', 'Otto', 'Pietra', 'Quim', 'Rui', 'Sol', 'Tainá', 'Ubirá', 'Vera', 'Yara', 'Zeca',
];

const pick = (n: number, random: () => number) => Math.min(n - 1, Math.floor(random() * n));

export function randomAppearance(random: () => number = Math.random): Appearance {
  return {
    body: pick(2, random) === 0 ? 'a' : 'b',
    skin: pick(appearanceLimits.skin, random),
    hairStyle: pick(appearanceLimits.hairStyle, random),
    hairColor: pick(appearanceLimits.hairColor, random),
    eyes: pick(appearanceLimits.eyes, random),
    outfit: pick(appearanceLimits.outfit, random),
  };
}

export function randomClass(random: () => number = Math.random): ClassId {
  return classIds[pick(classIds.length, random)]!;
}

export function randomName(random: () => number = Math.random): string {
  return heroNames[pick(heroNames.length, random)]!;
}

/** Rolagem de d20 (1–20). */
export function rollD20(random: () => number = Math.random): number {
  return pick(20, random) + 1;
}
