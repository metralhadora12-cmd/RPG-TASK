import { useMemo } from 'react';
import { formatDay } from '@/lib/date';
import { t, type MessageKey } from '@/lib/i18n';
import type { BossHit } from '@/store/bossActions';
import { emitSfx } from '@/lib/sfxBus';
import { useGameStore } from '@/store/useGameStore';
import { showToast } from '@/ui/toastStore';
import { hitScreen, originOf, showLevelUp, spawnFloats } from '@/features/progression/fxStore';

interface RewardFx {
  xp: number;
  gold: number;
  critical: boolean;
  levelsGained: number;
  fromLevel: number;
  toLevel: number;
  pointsGained: number;
}

/** Dano no chefe da semana (número flutuante) e aviso quando ele cai. */
function bossFx(hit: BossHit | undefined) {
  if (!hit?.defeated || !hit.reward) return;
  const boss = useGameStore.getState().boss;
  emitSfx('coins');
  showToast({
    message: t('boss.defeatedToast', {
      name: boss ? t(`boss.${boss.bossId}` as MessageKey) : t('boss.title'),
      xp: hit.reward.xp,
      gold: hit.reward.gold,
    }),
  });
  if (hit.reward.levelsGained > 0) {
    showLevelUp({ fromLevel: hit.reward.fromLevel, toLevel: hit.reward.toLevel, pointsGained: hit.reward.pointsGained });
  }
}

/** Números flutuantes de XP/Gold (e crítico) + tela de level up. */
function celebrate(reward: RewardFx, origin?: Element | null, boss?: BossHit) {
  // O jingle de level up já toca sozinho; o resto ganha o som de conclusão.
  if (reward.levelsGained === 0) emitSfx(reward.critical ? 'coins' : 'complete');
  spawnFloats(originOf(origin), [
    ...(reward.critical ? [{ kind: 'critical' as const, text: t('progress.critical') }] : []),
    { kind: 'xp', text: t('progress.xp', { n: reward.xp }) },
    { kind: 'gold', text: t('progress.gold', { n: reward.gold }) },
    ...(boss && boss.damage > 0 ? [{ kind: 'damage' as const, text: t('boss.hitFloat', { n: boss.damage }) }] : []),
  ]);
  if (reward.levelsGained > 0) {
    showLevelUp({ fromLevel: reward.fromLevel, toLevel: reward.toLevel, pointsGained: reward.pointsGained });
  }
}

/**
 * Ações de tarefa com feedback para o jogador (toasts com "Desfazer").
 */
export function useTaskCommands() {
  return useMemo(
    () => ({
      /**
       * Conclui (com XP/Gold, números flutuantes e level up) ou reabre (estornando).
       * `origin` é o elemento de onde os números sobem.
       */
      toggleComplete(id: string, origin?: Element | null) {
        const store = useGameStore.getState();
        const task = store.tasks.find((x) => x.id === id);
        if (!task) return;
        if (task.completedAt) {
          store.uncompleteTask(id);
          return;
        }
        const { spawnedDueDate, reward, boss } = store.completeTask(id);
        if (!reward) return;

        celebrate(reward, origin, boss);

        const rewardText = t(reward.critical ? 'progress.rewardToastCritical' : 'progress.rewardToast', {
          xp: reward.xp,
          gold: reward.gold,
        });
        showToast({
          message: spawnedDueDate
            ? `${rewardText} ${t('tasks.nextOccurrence', { date: formatDay(spawnedDueDate) })}`
            : rewardText,
          actionLabel: t('tasks.undo'),
          // Reabrir estorna XP/Gold e remove a próxima ocorrência intocada.
          onAction: () => useGameStore.getState().uncompleteTask(id),
        });
        bossFx(boss);
      },

      habitUp(id: string, origin?: Element | null) {
        const reward = useGameStore.getState().habitUp(id);
        if (!reward) return;
        celebrate(reward, origin, reward.boss);
        showToast({
          message: t('progress.habitUpToast', { xp: reward.xp, gold: reward.gold }),
          actionLabel: t('tasks.undo'),
          onAction: () => useGameStore.getState().revertHabit(reward.eventId),
        });
        bossFx(reward.boss);
      },

      habitDown(id: string, origin?: Element | null) {
        const result = useGameStore.getState().habitDown(id);
        if (!result) return;
        if (result.hpLost > 0) {
          spawnFloats(originOf(origin), [{ kind: 'damage', text: t('progress.hp', { n: result.hpLost }) }]);
          hitScreen();
        }
        // Desmaio abre a tela de Game Over e não pode ser desfeito.
        if (result.faint) return;
        showToast({
          message:
            result.hpLost > 0 ? t('progress.habitDownToast', { n: result.hpLost }) : t('progress.habitDownNoDamage'),
          actionLabel: t('tasks.undo'),
          onAction: () => useGameStore.getState().revertHabit(result.eventId),
        });
      },

      remove(id: string) {
        const removed = useGameStore.getState().deleteTask(id);
        if (!removed) return;
        showToast({
          message: t('tasks.deletedToast'),
          actionLabel: t('tasks.undo'),
          onAction: () => useGameStore.getState().restoreTask(removed),
        });
      },
    }),
    [],
  );
}
