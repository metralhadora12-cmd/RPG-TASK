import { heal } from '@/features/progression/formulas';
import { getItem, POTION_ID, slotOf, type ShopItem } from '@/features/shop/catalog';
import { priceFor } from '@/features/shop/offers';
import { createId } from '@/lib/id';
import { progressOf, REWARD_LOG_LIMIT, today } from './taskActions';
import type { Character, Slot } from './types';
import type { StoreGet, StoreSet } from './useGameStore';

export type BuyResult = { ok: true; price: number } | { ok: false; reason: 'unknown' | 'level' | 'gold' | 'owned' };

export interface ShopActions {
  buyItem: (itemId: string) => BuyResult;
  equipItem: (itemId: string) => boolean;
  unequip: (slot: Slot) => void;
  /** Bebe uma Poção de Vida; devolve o HP curado (0 se não deu). */
  usePotion: () => number;
}

export function owns(character: Character, itemId: string): boolean {
  return character.inventory.some((i) => i.itemId === itemId && i.qty > 0);
}

function addToInventory(c: Character, item: ShopItem): Character['inventory'] {
  const existing = c.inventory.find((i) => i.itemId === item.id);
  if (existing) return c.inventory.map((i) => (i.itemId === item.id ? { ...i, qty: i.qty + 1 } : i));
  return [...c.inventory, { itemId: item.id, qty: 1 }];
}

export function createShopActions(set: StoreSet, get: StoreGet): ShopActions {
  return {
    buyItem: (itemId) => {
      const { character } = get();
      const item = getItem(itemId);
      if (!item) return { ok: false, reason: 'unknown' };
      if (item.category !== 'consumable' && owns(character, itemId)) return { ok: false, reason: 'owned' };
      if (character.level < item.minLevel) return { ok: false, reason: 'level' };
      const price = priceFor(item, today(get));
      if (character.gold < price) return { ok: false, reason: 'gold' };
      const at = new Date().toISOString();
      set((s) => ({
        character: { ...s.character, gold: s.character.gold - price, inventory: addToInventory(s.character, item) },
        rewardLog: [
          ...s.rewardLog,
          { id: createId(), kind: 'purchase' as const, xp: 0, gold: -price, hp: 0, at, itemId, final: true },
        ].slice(-REWARD_LOG_LIMIT),
        lifetime: { ...s.lifetime, goldSpent: s.lifetime.goldSpent + price, itemsBought: s.lifetime.itemsBought + 1 },
      }));
      return { ok: true, price };
    },

    equipItem: (itemId) => {
      const item = getItem(itemId);
      if (!item || item.category === 'consumable' || !owns(get().character, itemId)) return false;
      const slot = slotOf[item.category];
      set((s) => ({
        character: { ...s.character, equipped: { ...s.character.equipped, [slot]: itemId } },
        ...(item.category === 'theme' ? { settings: { ...s.settings, theme: item.theme } } : {}),
      }));
      return true;
    },

    unequip: (slot) =>
      set((s) => {
        const equipped = { ...s.character.equipped };
        delete equipped[slot];
        return {
          character: { ...s.character, equipped },
          ...(slot === 'theme' ? { settings: { ...s.settings, theme: 'classic' as const } } : {}),
        };
      }),

    usePotion: () => {
      const { character } = get();
      const potion = getItem(POTION_ID);
      if (!potion || potion.category !== 'consumable' || !owns(character, POTION_ID)) return 0;
      const { state, healed } = heal(progressOf(character), potion.heal);
      if (healed <= 0) return 0;
      set((s) => ({
        character: {
          ...s.character,
          hp: state.hp,
          inventory: s.character.inventory
            .map((i) => (i.itemId === POTION_ID ? { ...i, qty: i.qty - 1 } : i))
            .filter((i) => i.qty > 0),
        },
        rewardLog: [
          ...s.rewardLog,
          { id: createId(), kind: 'potion' as const, xp: 0, gold: 0, hp: healed, at: new Date().toISOString(), final: true },
        ].slice(-REWARD_LOG_LIMIT),
      }));
      return healed;
    },
  };
}

