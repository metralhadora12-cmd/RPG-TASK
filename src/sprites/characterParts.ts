/**
 * Peças e paletas do personagem.
 *
 * Legenda das chaves de paleta usadas nas camadas:
 *   o contorno · w branco/brilho · r boca
 *   s/S pele (luz/sombra) · e íris
 *   h/H/l cabelo (base/sombra/brilho)
 *   c/C roupa · a/A detalhe · p/P calça · b/B couro/botas · m/M metal · v/V manga
 */
import type { ClassId } from '@/store/types';
import * as L from './layerData';
import type { LayerSource, SpritePalette } from './types';

export const OUTLINE = '#1a1428';
export const basePalette: SpritePalette = { o: OUTLINE, w: '#f8f8f8', r: '#a84040' };

// ---------------------------------------------------------------------------
// Pele, olhos e cabelo (recoloridos por troca de paleta)
// ---------------------------------------------------------------------------

export const skinTones: SpritePalette[] = [
  { s: '#fce0c8', S: '#e0b090' },
  { s: '#f8d0b0', S: '#d8a080' },
  { s: '#f0c090', S: '#c88860' },
  { s: '#e0a878', S: '#b07850' },
  { s: '#c88c5c', S: '#98643c' },
  { s: '#a86c40', S: '#784828' },
  { s: '#8a5430', S: '#603818' },
  { s: '#6a3c20', S: '#482410' },
];

export const eyeColors: { id: string; palette: SpritePalette }[] = [
  { id: 'blue', palette: { e: '#3050c0' } },
  { id: 'green', palette: { e: '#289048' } },
  { id: 'brown', palette: { e: '#704020' } },
  { id: 'gray', palette: { e: '#607080' } },
  { id: 'violet', palette: { e: '#7838b0' } },
  { id: 'amber', palette: { e: '#d08010' } },
];

export const hairColors: { id: string; palette: SpritePalette }[] = [
  { id: 'black', palette: { h: '#302838', H: '#18121e', l: '#585070' } },
  { id: 'darkBrown', palette: { h: '#5a3820', H: '#381f10', l: '#80583a' } },
  { id: 'brown', palette: { h: '#8a5a30', H: '#5a3818', l: '#b8844c' } },
  { id: 'auburn', palette: { h: '#c05028', H: '#803018', l: '#f08850' } },
  { id: 'ginger', palette: { h: '#e88028', H: '#a85010', l: '#f8b860' } },
  { id: 'blonde', palette: { h: '#f0c848', H: '#b88c20', l: '#fff098' } },
  { id: 'platinum', palette: { h: '#e8e0c8', H: '#b0a890', l: '#ffffff' } },
  { id: 'silver', palette: { h: '#a8acb8', H: '#707480', l: '#e0e4f0' } },
  { id: 'blue', palette: { h: '#3868d8', H: '#203c90', l: '#78a8f8' } },
  { id: 'green', palette: { h: '#38a048', H: '#1f6028', l: '#78d880' } },
  { id: 'purple', palette: { h: '#8848c0', H: '#582880', l: '#c088f0' } },
  { id: 'pink', palette: { h: '#f070a8', H: '#b04070', l: '#ffb0d0' } },
];

export interface HairStyle {
  id: string;
  front: LayerSource;
  back?: LayerSource;
}

export const hairStyles: HairStyle[] = [
  { id: 'short', front: L.hairShort },
  { id: 'bowl', front: L.hairBowl },
  { id: 'spiky', front: L.hairSpiky },
  { id: 'long', front: L.hairLong, back: L.hairLongBack },
  { id: 'ponytail', front: L.hairPony, back: L.hairPonyBack },
  { id: 'bun', front: L.hairBun },
  { id: 'afro', front: L.hairAfro },
  { id: 'twinTails', front: L.hairTwin, back: L.hairTwinBack },
  { id: 'mohawk', front: L.hairMohawk },
  { id: 'bald', front: L.hairBald },
];

export const bodyTypes = ['a', 'b'] as const;

// ---------------------------------------------------------------------------
// Roupas iniciais (3 por classe): formato + paleta
// ---------------------------------------------------------------------------

export const outfitShapes = {
  tunic: L.outfitTunic,
  robe: L.outfitRobe,
  armor: L.outfitArmor,
  vest: L.outfitVest,
} as const satisfies Record<string, LayerSource>;

export interface Outfit {
  id: string;
  shape: keyof typeof outfitShapes;
  palette: SpritePalette;
}

const leather = { b: '#704020', B: '#402010' };
const gold = { a: '#f0c030', A: '#b08010' };

export const classOutfits: Record<ClassId, Outfit[]> = {
  warrior: [
    {
      id: 'warrior-plate',
      shape: 'armor',
      palette: { ...leather, ...gold, m: '#d0d8e8', M: '#8890a8', p: '#687088', P: '#485068', v: '#a0a8b8', V: '#687088' },
    },
    {
      id: 'warrior-bronze',
      shape: 'armor',
      palette: { ...leather, ...gold, m: '#f0b868', M: '#a86828', p: '#584838', P: '#382818', v: '#c07838', V: '#884818' },
    },
    {
      id: 'warrior-squire',
      shape: 'tunic',
      palette: { ...leather, ...gold, c: '#c03830', C: '#882020', p: '#584838', P: '#382818', v: '#c03830', V: '#882020' },
    },
  ],
  mage: [
    {
      id: 'mage-arcane',
      shape: 'robe',
      palette: { ...leather, ...gold, c: '#3050b8', C: '#203080', v: '#3050b8', V: '#203080' },
    },
    {
      id: 'mage-dusk',
      shape: 'robe',
      palette: { ...leather, c: '#7040a8', C: '#482878', a: '#c8c8f0', A: '#9090c0', v: '#7040a8', V: '#482878' },
    },
    {
      id: 'mage-apprentice',
      shape: 'tunic',
      palette: { ...leather, c: '#20a098', C: '#107068', a: '#f0e0a0', A: '#c0b070', p: '#484060', P: '#302840', v: '#20a098', V: '#107068' },
    },
  ],
  rogue: [
    {
      id: 'rogue-leather',
      shape: 'vest',
      palette: { ...leather, c: '#8a5a30', C: '#603818', a: '#e8e0c8', A: '#b8b098', p: '#383040', P: '#201828', v: '#e8e0c8', V: '#b8b098' },
    },
    {
      id: 'rogue-night',
      shape: 'vest',
      palette: { b: '#282830', B: '#141418', c: '#303848', C: '#182028', a: '#704880', A: '#482858', p: '#202028', P: '#101018', v: '#303848', V: '#182028' },
    },
    {
      id: 'rogue-road',
      shape: 'tunic',
      palette: { ...leather, c: '#4a8a40', C: '#2a5a28', a: '#d0b060', A: '#907830', p: '#584838', P: '#382818', v: '#4a8a40', V: '#2a5a28' },
    },
  ],
  cleric: [
    {
      id: 'cleric-holy',
      shape: 'robe',
      palette: { ...leather, ...gold, c: '#f0f0f8', C: '#b8b8d0', v: '#f0f0f8', V: '#b8b8d0' },
    },
    {
      id: 'cleric-pilgrim',
      shape: 'robe',
      palette: { ...leather, c: '#9a7a58', C: '#6a5038', a: '#e8e0c8', A: '#b8b098', v: '#9a7a58', V: '#6a5038' },
    },
    {
      id: 'cleric-blessed',
      shape: 'armor',
      palette: { ...leather, a: '#f8f8f8', A: '#c8c8d8', m: '#f0e8c0', M: '#b8a060', p: '#8890a8', P: '#606880', v: '#f0e8c0', V: '#b8a060' },
    },
  ],
};

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export const classIds: ClassId[] = ['warrior', 'mage', 'rogue', 'cleric'];

/** Atributos iniciais (somam 22); o maior é o bônus da classe. */
export const classBaseStats: Record<ClassId, { str: number; int: number; agi: number; vit: number }> = {
  warrior: { str: 8, int: 3, agi: 5, vit: 6 },
  mage: { str: 3, int: 8, agi: 5, vit: 6 },
  rogue: { str: 5, int: 4, agi: 8, vit: 5 },
  cleric: { str: 5, int: 5, agi: 4, vit: 8 },
};

/** Quantidade de opções de cada parte (para o editor e o "Aleatório"). */
export const appearanceLimits = {
  body: bodyTypes.length,
  skin: skinTones.length,
  hairStyle: hairStyles.length,
  hairColor: hairColors.length,
  eyes: eyeColors.length,
  outfit: 3,
} as const;
