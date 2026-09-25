import { create } from 'zustand';
import { createId } from '@/lib/id';

export interface Toast {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Duração em ms (padrão 5000). */
  duration: number;
}

interface ToastState {
  toasts: Toast[];
}

const MAX_TOASTS = 3;

export const useToastStore = create<ToastState>(() => ({ toasts: [] }));

export function showToast(toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }): string {
  const id = createId();
  useToastStore.setState((s) => ({
    toasts: [...s.toasts, { duration: 5000, ...toast, id }].slice(-MAX_TOASTS),
  }));
  return id;
}

export function dismissToast(id: string): void {
  useToastStore.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

/** Executa a ação (ex.: Desfazer) do toast mais recente que tiver uma. */
export function runLatestToastAction(): boolean {
  const toast = [...useToastStore.getState().toasts].reverse().find((t) => t.onAction);
  if (!toast) return false;
  toast.onAction!();
  dismissToast(toast.id);
  return true;
}
