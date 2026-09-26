import type { CharacterLook, Equipment } from '@/sprites/compose';
import { itemPalette } from '@/sprites/compose';
import * as A from '@/sprites/itemData';
import { expandLayer } from '@/sprites/layers';

/** Bartolo, o mercador (NPC original montado com as mesmas peças do herói). */
export const merchantLook: CharacterLook = {
  classId: 'rogue',
  appearance: { body: 'b', skin: 4, hairStyle: 1, hairColor: 7, eyes: 2, outfit: 0 },
};

export const merchantEquipment: Equipment = {
  outfit: {
    id: 'merchant',
    shape: 'vest',
    palette: { b: '#5a3818', B: '#381f10', c: '#a83a28', C: '#78241a', a: '#f0e0b0', A: '#c0b080', p: '#484060', P: '#302840', v: '#f0e0b0', V: '#c0b080' },
  },
  hairClip: 9,
  layers: {
    hat: [
      { id: 'merchant-hat', rows: expandLayer(A.hatStraw), palette: itemPalette({ c: '#8a5a30', C: '#5a3818', a: '#e8c040' }) },
    ],
    accessory: [{ id: 'mustache', rows: expandLayer(A.npcMustache), palette: itemPalette({ H: '#b8bcc8' }) }],
  },
};
