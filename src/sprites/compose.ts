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
import { breatheRows, expandLayer, shiftRows, widenRows } from './layers';
import { derive, tone } from './palette';
import { HERO, SPRITE_SIZE, type PaletteLayer, type PixelGrid, type SpritePalette } from './types';

export type Pose = 'idle0' | 'idle1' | 'victory' | 'fainted';

/**
 * Ordem de desenho (de trás para frente). O herói está em 3/4 voltado para a direita:
 * o braço de trás (`armBack`) fica atrás do corpo e o da frente (`arms`) por cima da arma.
 * Itens da loja entram em `hat`, `weapon`, `accessory` e `pet`; camadas com `behind` vão para `back`.
 */
export const LAYER_ORDER = [
  'back',
  'hairBack',
  'armBack',
  'body',
  'outfit',
  'face',
  'hairFront',
  'hat',
  'weapon',
  'arms',
  'accessory',
  'pet',
] as const;

export type LayerSlot = (typeof LAYER_ORDER)[number];

export interface CharacterLook {
  appearance: Appearance;
  classId: ClassId;
}

/** Camadas extras (equipamentos) por slot. */
export type ExtraLayers = Partial<
  Record<Exclude<LayerSlot, 'hairBack' | 'armBack' | 'body' | 'outfit' | 'face' | 'hairFront' | 'arms'>, PaletteLayer[]>
>;

/** Equipamentos aplicados ao herói. */
export interface Equipment {
  layers?: ExtraLayers;
  /** Roupa equipada (substitui a roupa inicial). */
  outfit?: Outfit;
  /** Chapéus fechados (elmo, capuz) escondem o cabelo. */
  hideHair?: boolean;
  /** Chapéus com aba: o cabelo acima desta linha fica escondido dentro do chapéu. */
  hairClip?: number;
}

const at = <T,>(list: readonly T[], index: number): T => list[((index % list.length) + list.length) % list.length]!;
const EMPTY_ROW = '.'.repeat(SPRITE_SIZE);

/** Só os tons de pele (sem o branco/brilho padrão do `derive`, para não sobrepor o metal). */
function skinKeys(index: number): SpritePalette {
  const skin = derive(at(skinTones, index));
  return { t: skin.t!, s: skin.s!, S: skin.S!, u: skin.u! };
}

/** Paleta de uma camada de item da loja (contorno tinta; tons completados pelo `derive`). */
export function itemPalette(palette: SpritePalette): SpritePalette {
  return derive({ ...basePalette, ...palette });
}

/** Paleta de roupa (tecido, detalhes, couro, metal e a pele que aparece em golas e mãos). */
export function outfitPalette(palette: SpritePalette, skin = 2): SpritePalette {
  return derive({ ...basePalette, ...skinKeys(skin), ...palette });
}

/** Monta as camadas do personagem (já expandidas), em ordem de desenho. */
export function characterLayers(look: CharacterLook, pose: Pose, equipment: Equipment = {}): { slot: LayerSlot; layer: PaletteLayer }[] {
  const extras = equipment.layers ?? {};
  const { appearance, classId } = look;
  const skin = skinKeys(appearance.skin);
  const hair = at(hairStyles, appearance.hairStyle);
  const hairBase = derive(at(hairColors, appearance.hairColor).palette);
  const hairPalette: SpritePalette = { ...hairBase, o: tone(hairBase.k!, -1), a: '#e83870', A: '#a02850' };
  const outfit = equipment.outfit ?? at(classOutfits[classId], appearance.outfit);
  const shape = outfitShapes[outfit.shape];
  const clothes = outfitPalette(outfit.palette, appearance.skin);
  const eyes = derive(at(eyeColors, appearance.eyes).palette);
  const clip = equipment.hairClip;
  const hairRows = (rows: readonly string[]) => (clip == null ? rows : rows.map((r, y) => (y < clip ? EMPTY_ROW : r)));
  const hideHair = Boolean(equipment.hideHair);
  const [faceId, faceArt] =
    pose === 'fainted'
      ? (['face-closed', L.faceClosed] as const)
      : pose === 'victory'
        ? (['face-happy', L.faceHappy] as const)
        : (['face', L.faceOpen] as const);

  const base: Record<string, PaletteLayer[]> = {
    hairBack:
      hair.back && !hideHair ? [{ id: `hair-back-${hair.id}`, rows: hairRows(expandLayer(hair.back)), palette: hairPalette }] : [],
    armBack: [
      {
        id: pose === 'victory' ? 'arm-up' : 'arm-far',
        rows: expandLayer(pose === 'victory' ? shape.up : shape.far),
        palette: clothes,
        anchor: 'far',
      },
    ],
    body: [{ id: 'body', rows: expandLayer(L.body), palette: { ...skin, o: tone(skin.S!, -2.4) } }],
    outfit: [{ id: outfit.id, rows: expandLayer(shape.body), palette: clothes }],
    face: [
      {
        id: faceId,
        rows: expandLayer(faceArt),
        palette: {
          o: '#231a2a',
          W: '#ffffff',
          E: eyes.E!,
          e: eyes.e!,
          i: eyes.i!,
          s: skin.s!,
          S: skin.S!,
          u: skin.u!,
          r: tone(skin.S!, -1.2),
          x: tone(skin.S!, -2),
          k: hairBase.k!,
        },
      },
    ],
    hairFront: hideHair ? [] : [{ id: `hair-${hair.id}`, rows: hairRows(expandLayer(hair.front)), palette: hairPalette }],
    arms: [{ id: 'arms', rows: expandLayer(shape.near), palette: clothes, anchor: 'near' }],
  };

  const result: { slot: LayerSlot; layer: PaletteLayer }[] = [];
  for (const slot of LAYER_ORDER) {
    const own = base[slot] ?? [];
    const extra =
      slot === 'back'
        ? Object.values(extras)
            .flat()
            .filter((l) => l.behind)
        : (extras[slot as keyof ExtraLayers] ?? []).filter((l) => !l.behind);
    for (const layer of [...own, ...extra]) result.push({ slot, layer });
  }
  return result;
}

function emptyGrid(): PixelGrid {
  return Array.from({ length: SPRITE_SIZE }, () => Array<string | null>(SPRITE_SIZE).fill(null));
}

/** Desenha as camadas numa grade de cores, aplicando a paleta de cada uma. */
export function paintLayers(layers: { rows: readonly string[]; palette: SpritePalette }[]): PixelGrid {
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

/** Ajusta uma camada à silhueta (robusta: tronco alarga, braços deslizam) e ao quadro de respiração. */
function fitLayer(layer: PaletteLayer, wide: boolean, pose: Pose): readonly string[] {
  if (layer.fixed) return layer.rows;
  let rows: readonly string[] = layer.rows;
  if (wide) rows = layer.anchor ? shiftRows(rows, layer.anchor === 'near' ? -HERO.armShift : HERO.armShift) : widenRows(rows);
  if (pose === 'idle1') rows = breatheRows(rows);
  return rows;
}

/** Compõe o sprite completo do personagem para uma pose. */
export function composeCharacter(look: CharacterLook, pose: Pose, equipment: Equipment = {}): PixelGrid {
  const wide = look.appearance.body === 'b';
  const layers = characterLayers(look, pose, equipment).map(({ layer }) => ({
    rows: fitLayer(layer, wide, pose),
    palette: layer.palette,
  }));
  const grid = paintLayers(layers);
  return pose === 'fainted' ? layDown(grid) : grid;
}
