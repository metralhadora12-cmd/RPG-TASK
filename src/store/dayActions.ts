import { applyDamage, applyReward, computeReward, damageFor, maxHp } from '@/features/progression/formulas';
import { rolloverDailies } from '@/features/tasks/dayCycle';
import { gameDayKey } from '@/lib/date';
import { createId } from '@/lib/id';
import { progressOf, REWARD_LOG_LIMIT, revertOnCharacter, today } from './taskActions';
import { bossDamage } from '@/features/boss/boss';
import { undoBossDamage, type BossHit } from './bossActions';
import type { Character, FaintInfo, NightReport, RewardEvent, Task } from './types';
import type { GameState, StoreGet, StoreSet } from './useGameStore';

export interface HabitUpResult {
  eventId: string;
  xp: number;
  gold: number;
  critical: boolean;
  levelsGained: number;
  fromLevel: number;
  toLevel: number;
  pointsGained: number;
  /** Dano no chefe da semana (e recompensa, se ele caiu). */
  boss?: BossHit;
}

export interface HabitDownResult {
  eventId: string;
  hpLost: number;
  faint: FaintInfo | null;
}

export interface DayActions {
  /** Hábito positivo: recompensa como uma conclusão (sem passos/pontualidade/sequência). */
  habitUp: (id: string, options?: { random?: () => number }) => HabitUpResult | null;
  /** Hábito negativo: dano pela dificuldade (sem efeito com penalidades desligadas). */
  habitDown: (id: string) => HabitDownResult | null;
  /** Desfaz um clique de hábito (se não houve desmaio). */
  revertHabit: (eventId: string) => boolean;
  /** Fecha os dias pendentes; devolve o relatório (ou null se nada mudou). */
  processDayRollover: (now?: Date) => NightReport | null;
  dismissReport: () => void;
  dismissFaint: () => void;
}

const log = (s: GameState, ...events: RewardEvent[]) => [...s.rewardLog, ...events].slice(-REWARD_LOG_LIMIT);

function countsFor(task: Task, day: string) {
  return task.habitCounts && task.habitCounts.date === day ? task.habitCounts : { up: 0, down: 0, date: day };
}

/** Aplica dano no personagem; registra desmaio se o HP zerar. */
function damageCharacter(c: Character, amount: number) {
  const r = applyDamage(progressOf(c), amount);
  const faint: FaintInfo | null = r.faint ? { ...r.faint, level: c.level } : null;
  return { character: { ...c, ...r.state }, hpLost: r.hpLost, faint };
}

export function createDayActions(set: StoreSet, get: StoreGet): DayActions {
  return {
    habitUp: (id, options = {}) => {
      const state = get();
      const task = state.tasks.find((t) => t.id === id && t.kind === 'habit');
      if (!task) return null;
      const day = today(get);
      const c = state.character;
      const reward = computeReward({
        difficulty: task.difficulty,
        subtasksDone: 0,
        onTime: false,
        streak: 0,
        classId: c.classId,
        random: options.random ?? Math.random,
      });
      const applied = applyReward(progressOf(c), reward.xp, reward.gold);
      const now = new Date().toISOString();
      const event: RewardEvent = {
        id: createId(),
        taskId: id,
        kind: 'habitUp',
        xp: applied.delta.xp,
        gold: applied.delta.gold,
        hp: applied.delta.hpHealed,
        at: now,
        critical: reward.critical,
        levelsGained: applied.delta.levelsGained,
        hpHealed: applied.delta.hpHealed,
        mpHealed: applied.delta.mpHealed,
        pointsGained: applied.delta.pointsGained,
      };
      const counts = countsFor(task, day);
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, habitCounts: { ...counts, up: counts.up + 1 }, updatedAt: now } : t)),
        character: { ...s.character, ...applied.state },
        rewardLog: log(s, event),
        lifetime: {
          ...s.lifetime,
          xpEarned: s.lifetime.xpEarned + event.xp,
          goldEarned: s.lifetime.goldEarned + event.gold,
          criticals: s.lifetime.criticals + (reward.critical ? 1 : 0),
          habitUps: s.lifetime.habitUps + 1,
        },
      }));
      const boss = get().hitBoss(bossDamage(task.difficulty, reward.critical), event.id);
      return {
        boss,
        eventId: event.id,
        xp: event.xp,
        gold: event.gold,
        critical: reward.critical,
        levelsGained: applied.delta.levelsGained,
        fromLevel: c.level,
        toLevel: applied.state.level,
        pointsGained: applied.delta.pointsGained,
      };
    },

    habitDown: (id) => {
      const state = get();
      const task = state.tasks.find((t) => t.id === id && t.kind === 'habit');
      if (!task) return null;
      const day = today(get);
      const counts = countsFor(task, day);
      const amount = state.settings.penaltiesEnabled ? damageFor(task.difficulty, state.character.classId) : 0;
      const { character, hpLost, faint } = damageCharacter(state.character, amount);
      const now = new Date().toISOString();
      const event: RewardEvent = {
        id: createId(),
        taskId: id,
        kind: 'habitDown',
        xp: faint ? -faint.xpLost : 0,
        gold: faint ? -faint.goldLost : 0,
        hp: -hpLost,
        at: now,
        final: Boolean(faint),
      };
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, habitCounts: { ...counts, down: counts.down + 1 }, updatedAt: now } : t)),
        character,
        rewardLog: log(s, event, ...(faint ? [faintEvent(faint, now)] : [])),
        pendingFaint: faint ?? s.pendingFaint,
        lifetime: faint ? { ...s.lifetime, faints: s.lifetime.faints + 1 } : s.lifetime,
      }));
      return { eventId: event.id, hpLost, faint };
    },

    revertHabit: (eventId) => {
      const state = get();
      const event = state.rewardLog.find((e) => e.id === eventId);
      if (!event || event.revertedAt || event.final || (event.kind !== 'habitUp' && event.kind !== 'habitDown')) {
        return false;
      }
      const now = new Date().toISOString();
      set((s) => {
        const character =
          event.kind === 'habitUp'
            ? revertOnCharacter(s.character, event)
            : { ...s.character, hp: Math.min(s.character.hp - event.hp, maxHp(s.character.level)) };
        const logged = s.rewardLog.find((e) => e.id === eventId) ?? event;
        return {
          character,
          boss: undoBossDamage(s.boss, logged),
          tasks: s.tasks.map((t) => {
            if (t.id !== event.taskId || !t.habitCounts) return t;
            const key = event.kind === 'habitUp' ? 'up' : 'down';
            return { ...t, habitCounts: { ...t.habitCounts, [key]: Math.max(0, t.habitCounts[key] - 1) } };
          }),
          rewardLog: s.rewardLog.map((e) => (e.id === eventId ? { ...e, revertedAt: now } : e)),
          lifetime:
            event.kind === 'habitUp'
              ? {
                  ...s.lifetime,
                  xpEarned: Math.max(0, s.lifetime.xpEarned - event.xp),
                  goldEarned: Math.max(0, s.lifetime.goldEarned - event.gold),
                  criticals: Math.max(0, s.lifetime.criticals - (event.critical ? 1 : 0)),
                  habitUps: Math.max(0, s.lifetime.habitUps - 1),
                }
              : s.lifetime,
        };
      });
      return true;
    },

    processDayRollover: (now = new Date()) => {
      const state = get();
      const { character, settings } = state;
      const day = gameDayKey(now, settings.dayStartHour);
      const last = character.lastDayProcessed;
      if (!character.name || day <= last) return null;

      const result = rolloverDailies(state.tasks, last, day, settings.dayStartHour);
      const missed = result.missed.map((m) => ({
        title: m.title,
        difficulty: m.difficulty,
        damage: settings.penaltiesEnabled ? damageFor(m.difficulty, character.classId) : 0,
      }));
      const total = missed.reduce((sum, m) => sum + m.damage, 0);
      const hit = damageCharacter(character, total);
      const at = now.toISOString();
      const events: RewardEvent[] = result.missed.map((m, i) => ({
        id: createId(),
        taskId: m.taskId,
        kind: 'dailyMissed',
        xp: 0,
        gold: 0,
        hp: -missed[i]!.damage,
        at,
        final: true,
      }));
      if (hit.faint) events.push(faintEvent(hit.faint, at));

      const report: NightReport = {
        day: last,
        missed,
        completed: result.completed.map((c) => c.title),
        streaksLost: result.streaksLost.map(({ title, streak }) => ({ title, streak })),
        hpLost: hit.hpLost,
        penaltiesEnabled: settings.penaltiesEnabled,
        faint: hit.faint,
      };
      const worthShowing = missed.length > 0 || report.completed.length > 0;

      set((s) => ({
        tasks: result.tasks,
        character: { ...hit.character, lastDayProcessed: day },
        rewardLog: log(s, ...events),
        pendingReport: worthShowing ? report : s.pendingReport,
        pendingFaint: hit.faint ?? s.pendingFaint,
        lifetime: hit.faint ? { ...s.lifetime, faints: s.lifetime.faints + 1 } : s.lifetime,
      }));
      return worthShowing ? report : null;
    },

    dismissReport: () => set({ pendingReport: null }),
    dismissFaint: () => set({ pendingFaint: null }),
  };
}

function faintEvent(faint: FaintInfo, at: string): RewardEvent {
  return { id: createId(), kind: 'faint', xp: -faint.xpLost, gold: -faint.goldLost, hp: 0, at, final: true };
}
