import { useMemo } from 'react';
import { formatDay } from '@/lib/date';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import { showToast } from '@/ui/toastStore';
import { showLevelUp, spawnFloats } from '@/features/progression/fxStore';

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
        const { spawnedDueDate, reward } = store.completeTask(id);
        if (!reward) return;

        const rect = origin?.getBoundingClientRect();
        const point = rect
          ? { x: rect.left + rect.width / 2, y: rect.top }
          : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        spawnFloats(point, [
          ...(reward.critical ? [{ kind: 'critical' as const, text: t('progress.critical') }] : []),
          { kind: 'xp', text: t('progress.xp', { n: reward.xp }) },
          { kind: 'gold', text: t('progress.gold', { n: reward.gold }) },
        ]);
        if (reward.levelsGained > 0) {
          showLevelUp({ fromLevel: reward.fromLevel, toLevel: reward.toLevel, pointsGained: reward.pointsGained });
        }

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
