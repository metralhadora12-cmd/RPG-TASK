import blackIdle from '@/assets/pets/cat-black-idle.png';
import blackSleep from '@/assets/pets/cat-black-sleep.png';
import blackVictory from '@/assets/pets/cat-black-victory.png';
import gingerIdle from '@/assets/pets/cat-ginger-idle.png';
import gingerSleep from '@/assets/pets/cat-ginger-sleep.png';
import gingerVictory from '@/assets/pets/cat-ginger-victory.png';
import whiteIdle from '@/assets/pets/cat-white-idle.png';
import whiteSleep from '@/assets/pets/cat-white-sleep.png';
import whiteVictory from '@/assets/pets/cat-white-victory.png';

/**
 * Mascotes animados (pacote de gatos de terceiros, ver "Créditos" no README).
 * Tiras de quadros 36×32: abanando o rabo (parado), miando (vitória) e dormindo (desmaio).
 */
export const PET_FRAME = { width: 36, height: 32 } as const;

export type PetSpriteId = 'cat-ginger' | 'cat-black' | 'cat-white';
export type PetAnim = 'idle' | 'victory' | 'sleep';

export const PET_ART: Record<PetSpriteId, Record<PetAnim, { src: string; frames: number }>> = {
  'cat-ginger': { idle: { src: gingerIdle, frames: 5 }, victory: { src: gingerVictory, frames: 3 }, sleep: { src: gingerSleep, frames: 2 } },
  'cat-black': { idle: { src: blackIdle, frames: 5 }, victory: { src: blackVictory, frames: 3 }, sleep: { src: blackSleep, frames: 2 } },
  'cat-white': { idle: { src: whiteIdle, frames: 5 }, victory: { src: whiteVictory, frames: 3 }, sleep: { src: whiteSleep, frames: 2 } },
};
