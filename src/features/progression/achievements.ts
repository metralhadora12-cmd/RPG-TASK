import { catalog } from '@/features/shop/catalog';
import type { Character, LifetimeStats, Slot, TaskList } from '@/store/types';

export type MedalTier = 'bronze' | 'silver' | 'gold';

export interface AchievementContext {
  character: Character;
  lifetime: LifetimeStats;
  lists: TaskList[];
}

export interface Achievement {
  id: string;
  tier: MedalTier;
  /** Cor da fita da medalha (agrupa conquistas parecidas). */
  ribbon: 'quests' | 'streak' | 'level' | 'shop' | 'misc';
  check: (ctx: AchievementContext) => boolean;
}

const EQUIP_SLOTS: Slot[] = ['hat', 'armor', 'weapon', 'accessory', 'pet', 'background', 'theme'];
const cosmeticsOwned = (c: Character) =>
  c.inventory.filter((i) => catalog.some((item) => item.id === i.itemId && item.category !== 'consumable')).length;

export const achievements: Achievement[] = [
  { id: 'first-quest', tier: 'bronze', ribbon: 'quests', check: ({ lifetime }) => lifetime.tasksCompleted >= 1 },
  { id: 'quests-10', tier: 'bronze', ribbon: 'quests', check: ({ lifetime }) => lifetime.tasksCompleted >= 10 },
  { id: 'quests-100', tier: 'silver', ribbon: 'quests', check: ({ lifetime }) => lifetime.tasksCompleted >= 100 },
  { id: 'quests-1000', tier: 'gold', ribbon: 'quests', check: ({ lifetime }) => lifetime.tasksCompleted >= 1000 },
  { id: 'streak-7', tier: 'silver', ribbon: 'streak', check: ({ lifetime }) => lifetime.bestStreak >= 7 },
  { id: 'streak-30', tier: 'gold', ribbon: 'streak', check: ({ lifetime }) => lifetime.bestStreak >= 30 },
  { id: 'level-10', tier: 'bronze', ribbon: 'level', check: ({ character }) => character.level >= 10 },
  { id: 'level-25', tier: 'silver', ribbon: 'level', check: ({ character }) => character.level >= 25 },
  { id: 'level-50', tier: 'gold', ribbon: 'level', check: ({ character }) => character.level >= 50 },
  { id: 'first-purchase', tier: 'bronze', ribbon: 'shop', check: ({ lifetime }) => lifetime.itemsBought >= 1 },
  { id: 'collector-10', tier: 'silver', ribbon: 'shop', check: ({ character }) => cosmeticsOwned(character) >= 10 },
  {
    id: 'full-set',
    tier: 'gold',
    ribbon: 'shop',
    check: ({ character }) => EQUIP_SLOTS.every((slot) => Boolean(character.equipped[slot])),
  },
  { id: 'rich-1000', tier: 'silver', ribbon: 'shop', check: ({ lifetime }) => lifetime.goldEarned >= 1000 },
  { id: 'critical', tier: 'bronze', ribbon: 'misc', check: ({ lifetime }) => lifetime.criticals >= 1 },
  { id: 'good-habits-50', tier: 'silver', ribbon: 'streak', check: ({ lifetime }) => lifetime.habitUps >= 50 },
  { id: 'survivor', tier: 'bronze', ribbon: 'misc', check: ({ lifetime }) => lifetime.faints >= 1 },
  { id: 'list-maker', tier: 'bronze', ribbon: 'misc', check: ({ lists }) => lists.length >= 6 },
];

/** Conquistas que acabaram de ser alcançadas (e ainda não estão no personagem). */
export function newlyUnlocked(ctx: AchievementContext): string[] {
  return achievements.filter((a) => !ctx.character.achievements.includes(a.id) && a.check(ctx)).map((a) => a.id);
}
