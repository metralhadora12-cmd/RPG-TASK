import type { Equipment, ExtraLayers } from '@/sprites/compose';
import { expandLayer } from '@/sprites/layers';
import { basePalette } from '@/sprites/characterParts';
import type { Character, Slot } from '@/store/types';
import type { BackgroundId } from './backgrounds';
import { getItem } from './catalog';

export type Equipped = Partial<Record<Slot, string>>;

/** Converte os itens equipados em camadas/roupa para o compositor de sprites. */
export function equipmentFor(equipped: Equipped): Equipment {
  const layers: ExtraLayers = {};
  const result: Equipment = { layers };
  for (const id of Object.values(equipped)) {
    const item = getItem(id);
    if (!item) continue;
    if (item.category === 'armor') {
      result.outfit = { id: item.id, ...item.outfit };
    } else if (item.category === 'hat' || item.category === 'weapon' || item.category === 'accessory' || item.category === 'pet') {
      const layer = {
        id: item.id,
        rows: expandLayer(item.art),
        palette: { ...basePalette, ...item.palette },
        behind: item.behind,
        fixed: item.category === 'pet',
      };
      (layers[item.category] ??= []).push(layer);
      if (item.hidesHair) result.hideHair = true;
    }
  }
  return result;
}

export function backgroundFor(equipped: Equipped): BackgroundId | undefined {
  const item = getItem(equipped.background);
  return item?.category === 'background' ? item.background : undefined;
}

export function ownedQty(character: Character, itemId: string): number {
  return character.inventory.find((i) => i.itemId === itemId)?.qty ?? 0;
}
