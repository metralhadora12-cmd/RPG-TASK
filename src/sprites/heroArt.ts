import type { ClassId } from '@/store/types';
import cleric from '@/assets/heroes/cleric.png';
import mage from '@/assets/heroes/mage.png';
import rogue from '@/assets/heroes/rogue.png';
import warrior from '@/assets/heroes/warrior.png';

/**
 * Arte fixa de cada classe (gerada com o SpriteCook para o QuestLog, estilo chibi inspirado em Disgaea).
 * Todas as imagens têm a mesma altura e os pés na última linha.
 */
export const HERO_ART: Record<ClassId, { src: string; width: number; height: number }> = {
  warrior: { src: warrior, width: 92, height: 192 },
  mage: { src: mage, width: 112, height: 192 },
  rogue: { src: rogue, width: 91, height: 192 },
  cleric: { src: cleric, width: 102, height: 192 },
};

/** Altura de referência das artes (px). */
export const HERO_ART_HEIGHT = 192;
