import { bossForWeek, bossMaxHp, bossReward, weekKey } from '@/features/boss/boss';
import { applyReward } from '@/features/progression/formulas';
import { createId } from '@/lib/id';
import { progressOf, REWARD_LOG_LIMIT, today } from './taskActions';
import type { BossState, RewardEvent } from './types';
import type { GameState, StoreGet, StoreSet } from './useGameStore';

export interface BossHit {
  /** Dano efetivo (limitado ao HP que restava). */
  damage: number;
  defeated: boolean;
  /** Recompensa aplicada na derrota. */
  reward?: { xp: number; gold: number; levelsGained: number; fromLevel: number; toLevel: number; pointsGained: number };
}

export interface BossActions {
  /** Garante o chefe da semana atual (cria um novo quando a semana vira). */
  syncBoss: () => BossState;
  /** Causa dano no chefe e anota no evento de recompensa `eventId` (para desfazer). */
  hitBoss: (amount: number, eventId: string) => BossHit;
}

/** Chefe da semana corrente para o estado dado (sem gravar). */
export function currentBoss(s: GameState, day: string): BossState {
  const week = weekKey(day, s.settings.weekStartsOn);
  if (s.boss && s.boss.week === week) return s.boss;
  return { week, bossId: bossForWeek(week), maxHp: bossMaxHp(s.character.level), damage: 0 };
}

/** Estorna o dano de um evento desfeito (a derrota, se houve, continua valendo). */
export function undoBossDamage(boss: BossState | null, event: RewardEvent): BossState | null {
  if (!boss || !event.bossDamage || event.bossWeek !== boss.week) return boss;
  return { ...boss, damage: Math.max(0, boss.damage - event.bossDamage) };
}

export function createBossActions(set: StoreSet, get: StoreGet): BossActions {
  return {
    syncBoss: () => {
      const boss = currentBoss(get(), today(get));
      if (get().boss !== boss) set({ boss });
      return boss;
    },

    hitBoss: (amount, eventId) => {
      const s = get();
      const boss = currentBoss(s, today(get));
      if (boss.defeatedAt || amount <= 0) {
        if (s.boss !== boss) set({ boss });
        return { damage: 0, defeated: false };
      }
      const damage = Math.min(amount, boss.maxHp - boss.damage);
      const defeated = boss.damage + damage >= boss.maxHp;
      const now = new Date().toISOString();
      const next: BossState = { ...boss, damage: boss.damage + damage, ...(defeated ? { defeatedAt: now } : {}) };
      const tagged = s.rewardLog.map((e) => (e.id === eventId ? { ...e, bossDamage: damage, bossWeek: boss.week } : e));
      if (!defeated) {
        set({ boss: next, rewardLog: tagged });
        return { damage, defeated };
      }
      const c = s.character;
      const prize = bossReward(c.level);
      const applied = applyReward(progressOf(c), prize.xp, prize.gold);
      const event: RewardEvent = {
        id: createId(),
        kind: 'boss',
        xp: applied.delta.xp,
        gold: applied.delta.gold,
        hp: applied.delta.hpHealed,
        at: now,
        levelsGained: applied.delta.levelsGained,
        hpHealed: applied.delta.hpHealed,
        mpHealed: applied.delta.mpHealed,
        pointsGained: applied.delta.pointsGained,
        // A vitória sobre o chefe não é desfeita junto com a tarefa.
        final: true,
      };
      set((st) => ({
        boss: next,
        character: { ...st.character, ...applied.state },
        rewardLog: [...tagged, event].slice(-REWARD_LOG_LIMIT),
        lifetime: {
          ...st.lifetime,
          xpEarned: st.lifetime.xpEarned + event.xp,
          goldEarned: st.lifetime.goldEarned + event.gold,
          bossesDefeated: st.lifetime.bossesDefeated + 1,
        },
      }));
      return {
        damage,
        defeated,
        reward: {
          xp: event.xp,
          gold: event.gold,
          levelsGained: applied.delta.levelsGained,
          fromLevel: c.level,
          toLevel: applied.state.level,
          pointsGained: applied.delta.pointsGained,
        },
      };
    },
  };
}
