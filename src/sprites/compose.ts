import type { Appearance, ClassId } from '@/store/types';
import {
  basePalette,
  classOutfits,
  eyeColors,
  hairColors,
  hairStyles,
  outfitShapes,
  skinTones,
  type Outfit,
} from './characterParts';
import * as L from './layerData';
import { breatheRows, expandLayer, widenRows } from './layers';
import { SPRITE_SIZE, type PaletteLayer, type PixelGrid } from './types';

export type Pose = 'idle0' | 'idle1' | 'victory' | 'fainted';

/**
 * Ordem de desenho (de trás para frente). Itens da loja entram nos slots
 * `hat`, `weapon`, `accessory` e `pet`; camadas com `behind` vão para `back`.
 */
export const LAYER_ORDER = [
  'back',
  'hairBack',
  'body',
  'outfit',
  'face',
  'hairFront',
  'hat',
  'arms',
  'weapon',
  'accessory',
  'pet',
] as const;

export type LayerSlot = (typeof LAYER_ORDER)[number];

export interface CharacterLook {
  appearance: Appearance;
  classId: ClassId;
}

/** Camadas extras (equipamentos) por slot. */
export type ExtraLayers = Partial<Record<Exclude<LayerSlot, 'hairBack' | 'body' | 'outfit' | 'face' | 'hairFront' | 'arms'>, PaletteLayer[]>>;

/** Equipamentos aplicados ao herói. */
export interface Equipment {
  layers?: ExtraLayers;
  /** Roupa equipada (substitui a roupa inicial). */
  outfit?: Outfit;
  /** Chapéus fechados (elmo, capuz) escondem o cabelo. */
  hideHair?: boolean;
}

const at = <T,>(list: readonly T[], index: number): T => list[((index % list.length) + list.length) % list.length]!;

/** Monta as camadas do personagem (já expandidas), em ordem de desenho. */
export function characterLayers(look: CharacterLook, pose: Pose, equipment: Equipment = {}): { slot: LayerSlot; layer: PaletteLayer }[] {
  const extras = equipment.layers ?? {};
  const { appearance, classId } = look;
  const skin = at(skinTones, appearance.skin);
  const hair = at(hairStyles, appearance.hairStyle);
  const hairPalette = { ...basePalette, ...at(hairColors, appearance.hairColor).palette };
  const outfit = equipment.outfit ?? at(classOutfits[classId], appearance.outfit);
  // A gola deixa a pele aparecer, então a roupa também conhece a cor da pele.
  const outfitPalette = { ...basePalette, ...skin, ...outfit.palette };

  const base: Record<string, PaletteLayer[]> = {
    hairBack: hair.back && !equipment.hideHair ? [{ id: `hair-back-${hair.id}`, rows: expandLayer(hair.back), palette: hairPalette }] : [],
    body: [{ id: 'body', rows: expandLayer(L.body), palette: { ...basePalette, ...skin } }],
    outfit: [{ id: outfit.id, rows: expandLayer(outfitShapes[outfit.shape]), palette: outfitPalette }],
    face: [
      {
        id: pose === 'fainted' ? 'face-closed' : 'face',
        rows: expandLayer(pose === 'fainted' ? L.faceClosed : L.faceOpen),
        palette: { ...basePalette, ...skin, ...at(eyeColors, appearance.eyes).palette },
      },
    ],
    hairFront: equipment.hideHair ? [] : [{ id: `hair-${hair.id}`, rows: expandLayer(hair.front), palette: hairPalette }],
    arms: [
      {
        id: pose === 'victory' ? 'arms-victory' : 'arms',
        rows: expandLayer(pose === 'victory' ? L.armsVictory : L.armsDown),
        // Mãos com a pele, mangas com a roupa.
        palette: { ...basePalette, ...skin, v: outfit.palette.v ?? '#888888', V: outfit.palette.V ?? '#555555' },
      },
    ],
  };

  const result: { slot: LayerSlot; layer: PaletteLayer }[] = [];
  for (const slot of LAYER_ORDER) {
    const own = base[slot] ?? [];
    const extra = slot === 'back' ? Object.values(extras).flat().filter((l) => l.behind) : (extras[slot as keyof ExtraLayers] ?? []).filter((l) => !l.behind);
    for (const layer of [...own, ...extra]) result.push({ slot, layer });
  }
  return result;
}

function emptyGrid(): PixelGrid {
  return Array.from({ length: SPRITE_SIZE }, () => Array<string | null>(SPRITE_SIZE).fill(null));
}

/** Desenha as camadas numa grade de cores, aplicando a paleta de cada uma. */
export function paintLayers(layers: { rows: readonly string[]; palette: Record<string, string> }[]): PixelGrid {
  const grid = emptyGrid();
  for (const { rows, palette } of layers) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const key = row[x]!;
        if (key === '.') continue;
        const color = palette[key];
        if (color) grid[y]![x] = color;
      }
    });
  }
  return grid;
}

/** Gira 90° no sentido anti-horário e apoia a figura no chão (pose "desmaiado"). */
export function layDown(grid: PixelGrid): PixelGrid {
  const n = SPRITE_SIZE;
  const rotated = emptyGrid();
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) rotated[n - 1 - x]![y] = grid[y]![x]!;
  let bottom = -1;
  rotated.forEach((row, y) => {
    if (row.some(Boolean)) bottom = y;
  });
  const shift = bottom < 0 ? 0 : n - 1 - bottom;
  if (shift === 0) return rotated;
  const out = emptyGrid();
  for (let y = 0; y + shift < n; y++) out[y + shift] = rotated[y]!;
  return out;
}

/** Compõe o sprite completo do personagem para uma pose. */
export function composeCharacter(look: CharacterLook, pose: Pose, equipment: Equipment = {}): PixelGrid {
  const wide = look.appearance.body === 'b';
  const layers = characterLayers(look, pose, equipment).map(({ layer }) => {
    let rows: readonly string[] = layer.rows;
    if (!layer.fixed) {
      if (wide) rows = widenRows(rows);
      if (pose === 'idle1') rows = breatheRows(rows);
    }
    return { rows, palette: layer.palette };
  });
  const grid = paintLayers(layers);
  return pose === 'fainted' ? layDown(grid) : grid;
}
