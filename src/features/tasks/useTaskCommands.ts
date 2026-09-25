import { useMemo } from 'react';
import { formatDay } from '@/lib/date';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import { showToast } from '@/ui/toastStore';

/**
 * Ações de tarefa com feedback para o jogador (toasts com "Desfazer").
 * A fase de progressão pendura XP/Gold aqui.
 */
export function useTaskCommands() {
  return useMemo(
    () => ({
      toggleComplete(id: string) {
        const store = useGameStore.getState();
        const task = store.tasks.find((x) => x.id === id);
        if (!task) return;
        if (task.completedAt) {
          store.uncompleteTask(id);
          return;
        }
        const { spawnedId, spawnedDueDate } = store.completeTask(id);
        const message = spawnedDueDate
          ? `${t('tasks.completedToast')} ${t('tasks.nextOccurrence', { date: formatDay(spawnedDueDate) })}`
          : t('tasks.completedToast');
        showToast({
          message,
          actionLabel: t('tasks.undo'),
          onAction: () => {
            const s = useGameStore.getState();
            s.uncompleteTask(id);
            if (spawnedId) s.deleteTask(spawnedId);
          },
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
