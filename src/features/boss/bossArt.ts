import bloodDeath from '@/assets/bosses/blood-monster-death.png';
import bloodHurt from '@/assets/bosses/blood-monster-hurt.png';
import bloodIdle from '@/assets/bosses/blood-monster-idle.png';
import demonDeath from '@/assets/bosses/demon-death.png';
import demonHurt from '@/assets/bosses/demon-hurt.png';
import demonIdle from '@/assets/bosses/demon-idle.png';
import type { BossId } from './boss';

/**
 * Arte dos chefes: "Tiny RPG Character Asset Pack 02 (Free)" — Demon_A e Blood Monster_A.
 * Cada animação é uma tira horizontal de quadros de 42×28 (recortados dos quadros 100×100 do pacote).
 */
export const BOSS_FRAME = { width: 42, height: 28 } as const;

export type BossAnim = 'idle' | 'hurt' | 'death';

export const BOSS_ART: Record<BossId, Record<BossAnim, { src: string; frames: number }>> = {
  demon: {
    idle: { src: demonIdle, frames: 6 },
    hurt: { src: demonHurt, frames: 4 },
    death: { src: demonDeath, frames: 4 },
  },
  'blood-monster': {
    idle: { src: bloodIdle, frames: 6 },
    hurt: { src: bloodHurt, frames: 4 },
    death: { src: bloodDeath, frames: 4 },
  },
};
