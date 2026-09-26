import type { Equipment, ExtraLayers } from '@/sprites/compose';
import { expandLayer } from '@/sprites/layers';
import { itemPalette } from '@/sprites/compose';
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
      const palette = itemPalette(item.palette);
      (layers[item.category] ??= []).push({
        id: item.id,
        rows: expandLayer(item.art),
        palette,
        behind: item.behind,
        fixed: item.category === 'pet',
        // A arma fica na mão da frente e acompanha o braço.
        anchor: item.category === 'weapon' ? 'near' : undefined,
      });
      if (item.front) (layers.accessory ??= []).push({ id: `${item.id}-front`, rows: expandLayer(item.front), palette });
      if (item.hidesHair) result.hideHair = true;
      if (item.hairClip != null) result.hairClip = Math.max(result.hairClip ?? 0, item.hairClip);
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
