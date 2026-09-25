import { describe, expect, it } from 'vitest';
import { defaultCharacter, defaultLifetime } from '@/features/character/defaults';
import { ptBR } from '@/lib/i18n/pt-BR';
import { achievements, newlyUnlocked, type AchievementContext } from './achievements';

const ctx = (patch: Partial<AchievementContext> = {}): AchievementContext => ({
  character: defaultCharacter(),
  lifetime: defaultLifetime(),
  lists: [],
  ...patch,
});

describe('conquistas', () => {
  it('são pelo menos 15, com ids únicos e textos', () => {
    expect(achievements.length).toBeGreaterThanOrEqual(15);
    expect(new Set(achievements.map((a) => a.id)).size).toBe(achievements.length);
    for (const a of achievements) {
      expect(ptBR).toHaveProperty(`ach.${a.id}`);
      expect(ptBR).toHaveProperty(`ach.${a.id}.desc`);
    }
  });

  it('nada no começo', () => {
    expect(newlyUnlocked(ctx())).toEqual([]);
  });

  it('marcos de missões, sequência e nível', () => {
    const lifetime = { ...defaultLifetime(), tasksCompleted: 100, bestStreak: 7 };
    expect(newlyUnlocked(ctx({ lifetime }))).toEqual(['first-quest', 'quests-10', 'quests-100', 'streak-7']);
    const character = { ...defaultCharacter(), level: 25 };
    expect(newlyUnlocked(ctx({ character }))).toEqual(['level-10', 'level-25']);
  });

  it('não repete conquistas já obtidas', () => {
    const character = { ...defaultCharacter(), achievements: ['first-quest'] };
    expect(newlyUnlocked(ctx({ character, lifetime: { ...defaultLifetime(), tasksCompleted: 1 } }))).toEqual([]);
  });

  it('conjunto completo exige todos os espaços equipados', () => {
    const equipped = { hat: 'a', armor: 'b', weapon: 'c', accessory: 'd', pet: 'e', background: 'f' };
    expect(newlyUnlocked(ctx({ character: { ...defaultCharacter(), equipped } }))).not.toContain('full-set');
    expect(newlyUnlocked(ctx({ character: { ...defaultCharacter(), equipped: { ...equipped, theme: 'g' } } }))).toContain(
      'full-set',
    );
  });

  it('colecionador conta só cosméticos', () => {
    const inventory = [
      'hat-bandana', 'hat-straw', 'hat-hood', 'hat-wreath', 'hat-helmet',
      'wpn-sword', 'wpn-bow', 'acc-glasses', 'acc-scarf',
    ].map((itemId) => ({ itemId, qty: 1 }));
    const withPotion = [...inventory, { itemId: 'potion-life', qty: 5 }];
    expect(newlyUnlocked(ctx({ character: { ...defaultCharacter(), inventory: withPotion } }))).not.toContain('collector-10');
    const ten = [...inventory, { itemId: 'pet-slime', qty: 1 }];
    expect(newlyUnlocked(ctx({ character: { ...defaultCharacter(), inventory: ten } }))).toContain('collector-10');
  });
});
