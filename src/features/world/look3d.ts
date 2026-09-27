import { getItem } from '@/features/shop/catalog';
import { classOutfits, eyeColors, hairColors, hairStyles, skinTones } from '@/sprites/characterParts';
import type { Character, ClassId } from '@/store/types';

const at = <T,>(list: readonly T[], index: number): T => list[((index % list.length) + list.length) % list.length]!;

export type Build3D = 'plate' | 'tunic' | 'robe' | 'vest';

/** Cores e formas do herói 3D, tiradas das mesmas paletas do sprite. */
export interface HeroLook3D {
  classId: ClassId;
  hairStyle: string;
  /** Silhueta robusta (tronco mais largo). */
  wide: boolean;
  build: Build3D;
  skin: string;
  skinShade: string;
  hair: string;
  hairShade: string;
  eyes: string;
  /** Cor principal da roupa (tecido ou metal). */
  cloth: string;
  clothShade: string;
  sleeve: string;
  pants: string;
  leather: string;
  trim: string;
}

const BUILD: Record<string, Build3D> = { armor: 'plate', tunic: 'tunic', robe: 'robe', vest: 'vest' };

export function heroLook3D(character: Pick<Character, 'classId' | 'appearance' | 'equipped'>): HeroLook3D {
  const { appearance, classId } = character;
  const skin = at(skinTones, appearance.skin);
  const hair = at(hairColors, appearance.hairColor).palette;
  const armor = getItem(character.equipped.armor);
  const outfit = armor?.category === 'armor' ? armor.outfit : at(classOutfits[classId], appearance.outfit);
  const p = outfit.palette;
  const build = BUILD[outfit.shape] ?? 'tunic';
  const cloth = build === 'plate' ? (p.m ?? p.c) : p.c;
  const clothShade = build === 'plate' ? (p.M ?? p.C) : p.C;
  return {
    classId,
    hairStyle: at(hairStyles, appearance.hairStyle).id,
    wide: appearance.body === 'b',
    build,
    skin: skin.s!,
    skinShade: skin.S!,
    hair: hair.h!,
    hairShade: hair.H!,
    eyes: at(eyeColors, appearance.eyes).palette.e!,
    cloth: cloth ?? '#808080',
    clothShade: clothShade ?? '#505050',
    sleeve: p.v ?? cloth ?? '#808080',
    pants: p.p ?? clothShade ?? '#404040',
    leather: p.b ?? '#704020',
    trim: p.a ?? '#f0c030',
  };
}

export type PetKind = 'cat' | 'slime' | 'chick' | 'ghost' | 'dragon';

export interface PetLook3D {
  kind: PetKind;
  body: string;
  shade: string;
  accent: string;
  eyes: string;
}

/** Mascote equipado em 3D (forma pela família do item, cores pela paleta dele). */
export function petLook3D(itemId: string | undefined): PetLook3D | null {
  const item = getItem(itemId);
  if (!item || item.category !== 'pet') return null;
  const kind: PetKind = item.id.startsWith('pet-cat')
    ? 'cat'
    : (['slime', 'chick', 'ghost', 'dragon'] as const).find((k) => item.id === `pet-${k}`) ?? 'slime';
  const p = item.palette;
  return {
    kind,
    body: p.c ?? '#e89040',
    shade: p.C ?? '#a85a20',
    accent: p.a ?? p.w ?? '#f8a0b0',
    eyes: p.e ?? '#101010',
  };
}
