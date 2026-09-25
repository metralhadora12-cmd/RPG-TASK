import { format } from 'date-fns';
import { useEffect } from 'react';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import type { Task } from '@/store/types';
import { showToast } from '@/ui/toastStore';

/** Lembretes vencidos e ainda não disparados. `now` no formato yyyy-MM-ddTHH:mm. */
export function dueReminders(tasks: Task[], now: string): Task[] {
  return tasks.filter(
    (task) =>
      !task.completedAt &&
      task.reminderAt !== undefined &&
      task.reminderAt <= now &&
      (!task.reminderFiredAt || task.reminderFiredAt < task.reminderAt),
  );
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

function notify(task: Task) {
  const title = t('tasks.reminder.title', { title: task.title });
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, { body: t('tasks.reminder.body'), tag: task.id, icon: '/favicon.svg' });
      return;
    } catch {
      // Alguns navegadores móveis só permitem notificações via service worker.
    }
  }
  showToast({ message: title, duration: 10_000 });
}

/** Verifica lembretes periodicamente enquanto o app está aberto. */
export function useReminders(intervalMs = 20_000) {
  useEffect(() => {
    const check = () => {
      const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
      const { tasks, updateTask } = useGameStore.getState();
      for (const task of dueReminders(tasks, now)) {
        notify(task);
        updateTask(task.id, { reminderFiredAt: now });
      }
    };
    check();
    const timer = window.setInterval(check, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
}
