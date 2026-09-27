import { describe, expect, it } from 'vitest';
import { defaultCharacter } from '@/features/character/defaults';
import { classOutfits, hairColors, skinTones } from '@/sprites/characterParts';
import { heroLook3D, petLook3D } from './look3d';

describe('heroLook3D', () => {
  it('usa as paletas de pele, cabelo e roupa do sprite', () => {
    const c = { ...defaultCharacter(), classId: 'mage' as const };
    c.appearance = { ...c.appearance, skin: 3, hairColor: 4, outfit: 0, hairStyle: 3 };
    const look = heroLook3D(c);
    expect(look.skin).toBe(skinTones[3]!.s);
    expect(look.hair).toBe(hairColors[4]!.palette.h);
    expect(look.cloth).toBe(classOutfits.mage[0]!.palette.c);
    expect(look.build).toBe('robe');
    expect(look.hairStyle).toBe('long');
  });

  it('armadura de metal vira "plate" com a cor do metal', () => {
    const c = { ...defaultCharacter(), classId: 'warrior' as const };
    c.appearance = { ...c.appearance, outfit: 0 };
    const look = heroLook3D(c);
    expect(look.build).toBe('plate');
    expect(look.cloth).toBe(classOutfits.warrior[0]!.palette.m);
  });

  it('roupa equipada da loja substitui a inicial', () => {
    const c = { ...defaultCharacter(), equipped: { armor: 'armor-thief' } };
    const withShop = heroLook3D(c);
    const without = heroLook3D({ ...c, equipped: {} });
    expect(withShop.cloth === without.cloth && withShop.build === without.build).toBe(false);
  });
});

describe('petLook3D', () => {
  it('reconhece a família do mascote', () => {
    expect(petLook3D('pet-cat-black')?.kind).toBe('cat');
    expect(petLook3D('pet-dragon')?.kind).toBe('dragon');
    expect(petLook3D(undefined)).toBeNull();
    expect(petLook3D('hat-straw')).toBeNull();
  });
});
