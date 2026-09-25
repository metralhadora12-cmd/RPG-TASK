import { palette } from '@/ui/palette';
import { PixelIcon } from '@/ui/PixelIcon';
import type { Achievement, MedalTier } from './achievements';

// Medalha com fita (arte original).
const MEDAL = [
  '..RR....rr..',
  '..RRr..rRR..',
  '...RRrrRR...',
  '....RrrR....',
  '....oooo....',
  '..oommmmoo..',
  '.ommwmmmMmo.',
  '.omwmmmmmMo.',
  'omwmmmmmmMMo',
  'ommmmmmmmMMo',
  '.ommmmmmMMo.',
  '.oMmmmmmMMo.',
  '..ooMMMMoo..',
  '....oooo....',
] as const;

const tiers: Record<MedalTier, { m: string; M: string }> = {
  bronze: { m: '#d08850', M: '#8a5028' },
  silver: { m: '#d8e0f0', M: '#8890a8' },
  gold: { m: '#f8d040', M: '#b08010' },
};

const ribbons: Record<Achievement['ribbon'], { R: string; r: string }> = {
  quests: { R: palette.sky, r: '#3858b0' },
  streak: { R: palette.hpRed, r: '#a02020' },
  level: { R: palette.rarityEpic, r: '#703090' },
  shop: { R: palette.hpGreen, r: '#208020' },
  misc: { R: palette.rarityLegendary, r: '#a86010' },
};

const LOCKED = { m: '#505470', M: '#383a50', R: '#606478', r: '#484a60', w: '#707490' };

export function Medal({ achievement, unlocked, scale = 3 }: { achievement: Achievement; unlocked: boolean; scale?: number }) {
  const colors = unlocked
    ? { o: palette.ink, w: palette.white, ...tiers[achievement.tier], ...ribbons[achievement.ribbon] }
    : { o: palette.ink, ...LOCKED };
  return <PixelIcon matrix={MEDAL} colors={colors} scale={scale} />;
}
