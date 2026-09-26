import { itemPalette } from '@/sprites/compose';
import * as A from '@/sprites/itemData';
import type { LayerSource, SpritePalette } from '@/sprites/types';
import type { BossId } from './boss';

/** Arte dos chefes: criaturas do jogo em versões sombrias (pixel art em código). */
export const BOSS_ART: Record<BossId, { art: LayerSource; palette: SpritePalette }> = {
  'slime-king': { art: A.petSlime, palette: itemPalette({ c: '#8a38c8', C: '#4a1878', w: '#e8c8ff', e: '#f8e040' }) },
  'sloth-dragon': { art: A.petDragon, palette: itemPalette({ c: '#b83028', C: '#6a1010', a: '#f8a040', e: '#f8f040' }) },
  'clock-ghost': { art: A.petGhost, palette: itemPalette({ c: '#6878b8', C: '#384070', w: '#c8d8ff', a: '#f84860', e: '#f8f040' }) },
  'chaos-cat': { art: A.petCat, palette: itemPalette({ c: '#383048', C: '#1c1826', a: '#f84860', e: '#48f0a0' }) },
};
