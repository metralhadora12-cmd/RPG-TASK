import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ptBR } from '@/lib/i18n/pt-BR';
import { composeCharacter, itemPalette } from '@/sprites/compose';
import { expandLayer } from '@/sprites/layers';
import { useGameStore } from '@/store/useGameStore';
import { heroState } from '@/test/state';
import { maxHp } from '@/features/progression/formulas';
import { backgroundIds } from './backgrounds';
import { catalog, categories, getItem, POTION_ID, rarities } from './catalog';
import { equipmentFor } from './equipment';
import { dailyOffers, hashString, priceFor } from './offers';
import { PET_ART } from './petArt';

describe('catálogo', () => {
  it('tem pelo menos 40 itens com ids únicos, em todas as categorias', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(40);
    expect(new Set(catalog.map((i) => i.id)).size).toBe(catalog.length);
    for (const c of categories) expect(catalog.some((i) => i.category === c)).toBe(true);
    for (const r of rarities) expect(catalog.some((i) => i.rarity === r)).toBe(true);
  });

  it('todo item tem nome e descrição em pt-BR', () => {
    for (const item of catalog) {
      expect(ptBR).toHaveProperty(`item.${item.id}`);
      expect(ptBR).toHaveProperty(`item.${item.id}.desc`);
    }
  });

  it('raridade maior custa mais e pede mais nível (em média)', () => {
    const avg = (r: string, key: 'price' | 'minLevel') => {
      const items = catalog.filter((i) => i.rarity === r && i.category !== 'consumable');
      return items.reduce((s, i) => s + i[key], 0) / items.length;
    };
    for (let i = 1; i < rarities.length; i++) {
      expect(avg(rarities[i]!, 'price')).toBeGreaterThan(avg(rarities[i - 1]!, 'price'));
      expect(avg(rarities[i]!, 'minLevel')).toBeGreaterThanOrEqual(avg(rarities[i - 1]!, 'minLevel'));
    }
  });

  it('a arte de cada item é 64×64 e toda chave tem cor', () => {
    for (const item of catalog) {
      if (!('art' in item)) continue;
      const palette = itemPalette(item.palette);
      for (const art of [item.art, item.front].filter(Boolean)) {
        const rows = expandLayer(art!);
        expect(rows).toHaveLength(64);
        for (const row of rows) {
          expect(row).toHaveLength(64);
          for (const ch of row) if (ch !== '.') expect(palette[ch], `${item.id} usa "${ch}"`).toBeDefined();
        }
      }
    }
  });

  it('gatos animados têm as três animações (parado, vitória, dormindo)', () => {
    const cats = catalog.filter((i) => i.category === 'pet' && i.sprite);
    expect(cats.map((i) => i.id).sort()).toEqual(['pet-cat', 'pet-cat-black', 'pet-cat-white']);
    for (const cat of cats) {
      const art = PET_ART[(cat as { sprite: keyof typeof PET_ART }).sprite];
      expect(Object.keys(art).sort()).toEqual(['idle', 'sleep', 'victory']);
      for (const anim of Object.values(art)) expect(anim.frames).toBeGreaterThan(1);
    }
  });

  it('tem os 5 fundos e a Poção de Vida (15 HP, 25G)', () => {
    expect(catalog.filter((i) => i.category === 'background').map((i) => 'background' in i && i.background).sort()).toEqual(
      [...backgroundIds].sort(),
    );
    expect(getItem(POTION_ID)).toMatchObject({ category: 'consumable', heal: 15, price: 25 });
  });
});

describe('equipamento no sprite', () => {
  const look = { classId: 'warrior' as const, appearance: { body: 'a' as const, skin: 2, hairStyle: 0, hairColor: 3, eyes: 0, outfit: 0 } };

  it('chapéu, arma, roupa e mascote mudam o sprite; elmo esconde o cabelo', () => {
    const plain = composeCharacter(look, 'idle0');
    const eq = equipmentFor({ hat: 'hat-helmet', weapon: 'wpn-sword', armor: 'armor-thief', pet: 'pet-slime' });
    expect(eq.hideHair).toBe(true);
    expect(eq.outfit?.shape).toBe('vest');
    const dressed = composeCharacter(look, 'idle0', eq);
    expect(dressed).not.toEqual(plain);
    // Mascote fixo no canto inferior direito, inclusive no quadro de respiração.
    const breathing = composeCharacter(look, 'idle1', eq);
    expect(breathing[55]!.slice(48)).toEqual(dressed[55]!.slice(48));
    expect(dressed[55]!.slice(48).some(Boolean)).toBe(true);
  });

  it('chapéu de aba corta o cabelo; capa tem gola na frente; arma acompanha o braço', () => {
    const eq = equipmentFor({ hat: 'hat-wizard', accessory: 'acc-cape', weapon: 'wpn-sword' });
    expect(eq.hairClip).toBe(9);
    expect(eq.hideHair).toBeUndefined();
    expect(eq.layers?.accessory?.map((l) => [l.id, Boolean(l.behind)])).toEqual([
      ['acc-cape', true],
      ['acc-cape-front', false],
    ]);
    expect(eq.layers?.weapon?.[0]?.anchor).toBe('near');
  });

  it('ignora ids desconhecidos', () => {
    expect(equipmentFor({ hat: 'nao-existe' })).toEqual({ layers: {} });
  });
});

describe('ofertas do dia', () => {
  it('4 itens estáveis no mesmo dia e diferentes entre dias', () => {
    const a = dailyOffers('2026-09-25');
    expect(a).toHaveLength(4);
    expect(new Set(a).size).toBe(4);
    expect(dailyOffers('2026-09-25')).toEqual(a);
    const days = ['2026-09-26', '2026-09-27', '2026-09-28'].map(dailyOffers);
    expect(days.some((d) => d.join() !== a.join())).toBe(true);
    expect(a).not.toContain(POTION_ID);
    expect(hashString('a')).not.toBe(hashString('b'));
  });

  it('20% de desconto só nos itens em oferta', () => {
    const [offer] = dailyOffers('2026-09-25');
    const item = getItem(offer)!;
    expect(priceFor(item, '2026-09-25')).toBe(Math.round(item.price * 0.8));
    const other = catalog.find((i) => !dailyOffers('2026-09-25').includes(i.id))!;
    expect(priceFor(other, '2026-09-25')).toBe(other.price);
  });
});

describe('ações da loja', () => {
  const store = () => useGameStore.getState();
  const hero = () => store().character;
  const day = '2026-09-25';
  const regular = catalog.find((i) => i.id === 'hat-bandana' && !dailyOffers(day).includes(i.id)) ?? getItem('hat-bandana')!;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
    useGameStore.setState(heroState());
  });
  afterEach(() => vi.useRealTimers());

  it('compra desconta Gold, guarda no inventário e registra', () => {
    useGameStore.setState((s) => ({ character: { ...s.character, gold: 100 } }));
    const price = priceFor(regular, day);
    expect(store().buyItem(regular.id)).toEqual({ ok: true, price });
    expect(hero().gold).toBe(100 - price);
    expect(hero().inventory).toEqual([{ itemId: regular.id, qty: 1 }]);
    expect(store().lifetime).toMatchObject({ goldSpent: price, itemsBought: 1 });
    expect(store().rewardLog.at(-1)).toMatchObject({ kind: 'purchase', gold: -price, itemId: regular.id });
    expect(store().buyItem(regular.id)).toEqual({ ok: false, reason: 'owned' });
  });

  it('recusa sem Gold ou sem nível', () => {
    expect(store().buyItem('hat-bandana')).toEqual({ ok: false, reason: 'gold' });
    useGameStore.setState((s) => ({ character: { ...s.character, gold: 9999 } }));
    expect(store().buyItem('hat-crown')).toEqual({ ok: false, reason: 'level' });
    expect(store().buyItem('xyz')).toEqual({ ok: false, reason: 'unknown' });
  });

  it('equipa e tira; tema equipado muda as janelas', () => {
    useGameStore.setState((s) => ({ character: { ...s.character, gold: 9999, level: 10 } }));
    expect(store().equipItem('theme-lava')).toBe(false); // não possui
    store().buyItem('theme-lava');
    store().buyItem('wpn-sword');
    expect(store().equipItem('theme-lava')).toBe(true);
    expect(store().settings.theme).toBe('lava');
    store().equipItem('wpn-sword');
    expect(hero().equipped).toEqual({ theme: 'theme-lava', weapon: 'wpn-sword' });
    store().unequip('theme');
    expect(store().settings.theme).toBe('classic');
    expect(hero().equipped).toEqual({ weapon: 'wpn-sword' });
  });

  it('poção empilha, cura 15 HP e some quando acaba', () => {
    useGameStore.setState((s) => ({ character: { ...s.character, gold: 100, hp: 20 } }));
    store().buyItem(POTION_ID);
    store().buyItem(POTION_ID);
    expect(hero().inventory).toEqual([{ itemId: POTION_ID, qty: 2 }]);
    expect(store().usePotion()).toBe(15);
    expect(hero().hp).toBe(35);
    useGameStore.setState((s) => ({ character: { ...s.character, hp: maxHp(1) - 4 } }));
    expect(store().usePotion()).toBe(4);
    expect(hero().inventory).toEqual([]);
    expect(store().usePotion()).toBe(0);
  });

  it('não gasta poção com HP cheio', () => {
    useGameStore.setState((s) => ({ character: { ...s.character, gold: 100 } }));
    store().buyItem(POTION_ID);
    expect(store().usePotion()).toBe(0);
    expect(hero().inventory).toEqual([{ itemId: POTION_ID, qty: 1 }]);
  });
});
