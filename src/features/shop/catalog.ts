/**
 * Catálogo da loja (arte original). Itens são cosméticos, exceto consumíveis.
 * Nomes e descrições ficam em `src/lib/i18n/items.pt-BR.ts` (chaves `item.<id>` e `item.<id>.desc`).
 */
import type { Outfit } from '@/sprites/characterParts';
import * as A from '@/sprites/itemData';
import type { LayerSource, SpritePalette } from '@/sprites/types';
import type { Slot } from '@/store/types';
import type { ThemeId } from '@/ui/palette';
import type { BackgroundId } from './backgrounds';
import type { PetSpriteId } from './petArt';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export type ItemCategory = 'hat' | 'armor' | 'weapon' | 'accessory' | 'pet' | 'background' | 'theme' | 'consumable';
export const categories: ItemCategory[] = ['hat', 'armor', 'weapon', 'accessory', 'pet', 'background', 'theme', 'consumable'];

interface BaseItem {
  id: string;
  price: number;
  rarity: Rarity;
  minLevel: number;
}

export interface LayerItem extends BaseItem {
  category: 'hat' | 'weapon' | 'accessory' | 'pet';
  art: LayerSource;
  palette: SpritePalette;
  /** Desenhado atrás do corpo (capas, asas). */
  behind?: boolean;
  /** Esconde o cabelo (elmo, capuz). */
  hidesHair?: boolean;
  /** Chapéus com aba: esconde o cabelo acima desta linha (fica dentro do chapéu). */
  hairClip?: number;
  /** Parte da frente (ex.: gola e fecho da capa), desenhada por cima do corpo. */
  front?: LayerSource;
  /** Mascote com sprite animado (tiras em `petArt.ts`); `art` fica como reserva. */
  sprite?: PetSpriteId;
}

export interface ArmorItem extends BaseItem {
  category: 'armor';
  outfit: Omit<Outfit, 'id'>;
}

export interface BackgroundItem extends BaseItem {
  category: 'background';
  background: BackgroundId;
}

export interface ThemeItem extends BaseItem {
  category: 'theme';
  theme: ThemeId;
}

export interface ConsumableItem extends BaseItem {
  category: 'consumable';
  heal: number;
}

export type ShopItem = LayerItem | ArmorItem | BackgroundItem | ThemeItem | ConsumableItem;

/** Slot de equipamento de cada categoria (consumíveis não equipam). */
export const slotOf: Record<Exclude<ItemCategory, 'consumable'>, Slot> = {
  hat: 'hat',
  armor: 'armor',
  weapon: 'weapon',
  accessory: 'accessory',
  pet: 'pet',
  background: 'background',
  theme: 'theme',
};

const leather = { b: '#704020', B: '#402010' };

export const POTION_ID = 'potion-life';

export const catalog: ShopItem[] = [
  // Chapéus
  { id: 'hat-bandana', category: 'hat', price: 30, rarity: 'common', minLevel: 1, art: A.hatBandana, palette: { c: '#c83830', C: '#882020', a: '#f8f8f8' } },
  { id: 'hat-straw', category: 'hat', price: 40, rarity: 'common', minLevel: 1, art: A.hatStraw, hairClip: 9, palette: { c: '#e8c870', C: '#b09040', a: '#c83830' } },
  { id: 'hat-hood', category: 'hat', price: 60, rarity: 'common', minLevel: 2, art: A.hatHood, hidesHair: true, palette: { c: '#3a7a38', C: '#245024' } },
  { id: 'hat-wreath', category: 'hat', price: 90, rarity: 'uncommon', minLevel: 3, art: A.hatWreath, palette: { c: '#48a048', C: '#2a6a2a', a: '#f878b0', A: '#f8e070' } },
  { id: 'hat-helmet', category: 'hat', price: 120, rarity: 'uncommon', minLevel: 3, art: A.hatHelmet, hidesHair: true, palette: { m: '#c8d0e0', M: '#7880a0', a: '#a06030', w: '#ffffff' } },
  { id: 'hat-wizard', category: 'hat', price: 220, rarity: 'rare', minLevel: 6, art: A.hatWizard, hairClip: 9, palette: { c: '#6a38b8', C: '#40207a', a: '#f0c030' } },
  { id: 'hat-helmet-royal', category: 'hat', price: 480, rarity: 'epic', minLevel: 10, art: A.hatHelmet, hidesHair: true, palette: { m: '#f8d860', M: '#b08820', a: '#c83830', w: '#fff8c0' } },
  { id: 'hat-wizard-astral', category: 'hat', price: 520, rarity: 'epic', minLevel: 10, art: A.hatWizard, hairClip: 9, palette: { c: '#182048', C: '#0c1028', a: '#a8e8ff' } },
  { id: 'hat-crown', category: 'hat', price: 1200, rarity: 'legendary', minLevel: 15, art: A.hatCrown, palette: { a: '#f8c838', A: '#b08010', c: '#e83850' } },

  // Roupas
  { id: 'armor-traveler', category: 'armor', price: 50, rarity: 'common', minLevel: 1, outfit: { shape: 'tunic', palette: { ...leather, c: '#8a6a48', C: '#5a4028', a: '#e0c080', A: '#a08850', p: '#484038', P: '#302820', v: '#8a6a48', V: '#5a4028' } } },
  { id: 'armor-thief', category: 'armor', price: 110, rarity: 'uncommon', minLevel: 3, outfit: { shape: 'vest', palette: { b: '#302828', B: '#181414', c: '#2a5a3a', C: '#183a24', a: '#c8c8b0', A: '#989880', p: '#282830', P: '#141418', v: '#c8c8b0', V: '#989880' } } },
  { id: 'armor-starry', category: 'armor', price: 260, rarity: 'rare', minLevel: 6, outfit: { shape: 'robe', palette: { ...leather, c: '#1c2a6a', C: '#101a48', a: '#f8e070', A: '#c0a030', v: '#1c2a6a', V: '#101a48' } } },
  { id: 'armor-oracle', category: 'armor', price: 300, rarity: 'rare', minLevel: 6, outfit: { shape: 'robe', palette: { ...leather, c: '#e8f0f8', C: '#a8c0d8', a: '#38b8c8', A: '#208898', v: '#e8f0f8', V: '#a8c0d8' } } },
  { id: 'armor-mithril', category: 'armor', price: 550, rarity: 'epic', minLevel: 10, outfit: { shape: 'armor', palette: { ...leather, m: '#d8f0ff', M: '#88a8c8', p: '#6888a8', P: '#486888', a: '#88e0ff', A: '#48a0c8', v: '#a8c8e8', V: '#6888a8' } } },
  { id: 'armor-dragon', category: 'armor', price: 1400, rarity: 'legendary', minLevel: 15, outfit: { shape: 'armor', palette: { b: '#301818', B: '#180808', m: '#e84830', M: '#881818', p: '#301818', P: '#180808', a: '#f8c838', A: '#b08010', v: '#b02020', V: '#701010' } } },

  // Armas (na mão da frente, que continua segurando a arma na pose de vitória)
  { id: 'wpn-sword', category: 'weapon', price: 45, rarity: 'common', minLevel: 1, art: A.wpnSword, palette: { m: '#d8e0f0', M: '#8890a8', a: '#b08040', b: '#6a4020' } },
  { id: 'wpn-bow', category: 'weapon', price: 95, rarity: 'uncommon', minLevel: 2, art: A.wpnBow, palette: { b: '#9a6a38', w: '#f0f0f0', a: '#c83830' } },
  { id: 'wpn-staff-oak', category: 'weapon', price: 100, rarity: 'uncommon', minLevel: 3, art: A.wpnStaff, palette: { c: '#48c060', C: '#287838', w: '#e0ffe0', b: '#8a5a30', B: '#5a3818' } },
  { id: 'wpn-axe', category: 'weapon', price: 240, rarity: 'rare', minLevel: 6, art: A.wpnAxe, palette: { m: '#c8d0e0', M: '#7880a0', b: '#7a4a28', a: '#b08040' } },
  { id: 'wpn-staff-arcane', category: 'weapon', price: 280, rarity: 'rare', minLevel: 6, art: A.wpnStaff, palette: { c: '#a048f0', C: '#6828a8', w: '#f0d8ff', b: '#303048', B: '#181828' } },
  { id: 'wpn-sword-flame', category: 'weapon', price: 600, rarity: 'epic', minLevel: 10, art: A.wpnSword, palette: { m: '#f8b040', M: '#e04818', a: '#402020', b: '#281010' } },
  { id: 'wpn-sword-legend', category: 'weapon', price: 1300, rarity: 'legendary', minLevel: 15, art: A.wpnSword, palette: { m: '#a8f0ff', M: '#38a8d0', a: '#f8d860', b: '#f8f8f8' } },

  // Acessórios
  { id: 'acc-glasses', category: 'accessory', price: 35, rarity: 'common', minLevel: 1, art: A.accGlasses, palette: {} },
  { id: 'acc-scarf', category: 'accessory', price: 45, rarity: 'common', minLevel: 1, art: A.accScarf, palette: { c: '#e8a020', C: '#a86810', a: '#f8f0d0' } },
  { id: 'acc-cape', category: 'accessory', price: 130, rarity: 'uncommon', minLevel: 3, art: A.accCape, front: A.accCapeFront, behind: true, palette: { c: '#b82828', C: '#801818', a: '#f0c030' } },
  { id: 'acc-amulet', category: 'accessory', price: 250, rarity: 'rare', minLevel: 6, art: A.accAmulet, palette: { a: '#f0c030', c: '#38d8a8', C: '#189878' } },
  { id: 'acc-cape-royal', category: 'accessory', price: 500, rarity: 'epic', minLevel: 10, art: A.accCape, front: A.accCapeFront, behind: true, palette: { c: '#5a2890', C: '#381860', a: '#f8d860' } },
  { id: 'acc-wings', category: 'accessory', price: 1100, rarity: 'legendary', minLevel: 15, art: A.accWings, behind: true, palette: { w: '#f8f8ff', c: '#b8d8ff' } },

  // Mascotes
  { id: 'pet-slime', category: 'pet', price: 60, rarity: 'common', minLevel: 1, art: A.petSlime, palette: { c: '#58c848', C: '#2e8028', w: '#d8ffd0', e: '#102010' } },
  { id: 'pet-chick', category: 'pet', price: 120, rarity: 'uncommon', minLevel: 2, art: A.petChick, palette: { c: '#f8d848', C: '#c8a020', a: '#f08820', e: '#101010' } },
  { id: 'pet-cat', category: 'pet', price: 150, rarity: 'uncommon', minLevel: 4, art: A.petCat, sprite: 'cat-ginger', palette: { c: '#e89040', C: '#a85a20', a: '#f8a0b0', e: '#203018' } },
  { id: 'pet-cat-black', category: 'pet', price: 180, rarity: 'uncommon', minLevel: 4, art: A.petCat, sprite: 'cat-black', palette: { c: '#4a4450', C: '#2a2630', a: '#f8a0b0', e: '#f0d040' } },
  { id: 'pet-cat-white', category: 'pet', price: 360, rarity: 'rare', minLevel: 7, art: A.petCat, sprite: 'cat-white', palette: { c: '#d8d8e8', C: '#a0a0b8', a: '#f8a0b0', e: '#4060c0' } },
  { id: 'pet-ghost', category: 'pet', price: 320, rarity: 'rare', minLevel: 7, art: A.petGhost, palette: { c: '#f0f0ff', C: '#b8b8d8', w: '#ffffff', a: '#f8a0c0', e: '#303050' } },
  { id: 'pet-dragon', category: 'pet', price: 1000, rarity: 'legendary', minLevel: 15, art: A.petDragon, palette: { c: '#48b868', C: '#287840', a: '#f8d860', e: '#f83030' } },

  // Fundos de cenário
  { id: 'bg-village', category: 'background', price: 50, rarity: 'common', minLevel: 1, background: 'village' },
  { id: 'bg-forest', category: 'background', price: 70, rarity: 'common', minLevel: 2, background: 'forest' },
  { id: 'bg-mountain', category: 'background', price: 150, rarity: 'uncommon', minLevel: 4, background: 'mountain' },
  { id: 'bg-castle', category: 'background', price: 300, rarity: 'rare', minLevel: 8, background: 'castle' },
  { id: 'bg-night', category: 'background', price: 450, rarity: 'epic', minLevel: 10, background: 'night' },

  // Temas de janela (Azul Clássico é grátis)
  { id: 'theme-parchment', category: 'theme', price: 100, rarity: 'uncommon', minLevel: 2, theme: 'parchment' },
  { id: 'theme-forest', category: 'theme', price: 120, rarity: 'uncommon', minLevel: 3, theme: 'forest' },
  { id: 'theme-lava', category: 'theme', price: 250, rarity: 'rare', minLevel: 6, theme: 'lava' },
  { id: 'theme-starry', category: 'theme', price: 450, rarity: 'epic', minLevel: 10, theme: 'starry' },

  // Consumíveis
  { id: POTION_ID, category: 'consumable', price: 25, rarity: 'common', minLevel: 1, heal: 15 },
];

const byId = new Map(catalog.map((item) => [item.id, item]));

export function getItem(id: string | undefined): ShopItem | undefined {
  return id ? byId.get(id) : undefined;
}

/** Item de tema correspondente a um ThemeId (o clássico não é vendido). */
export function themeItemId(theme: ThemeId): string | undefined {
  return catalog.find((i) => i.category === 'theme' && i.theme === theme)?.id;
}
