import { useEffect } from 'react';
import { Button } from './Button';
import { dismissToast, runLatestToastAction, useToastStore, type Toast } from './toastStore';

function ToastItem({ toast }: { toast: Toast }) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismissToast(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration]);

  return (
    <div className="win pointer-events-auto flex items-center gap-3 px-4 py-2">
      <span className="text-shadow-pixel">{toast.message}</span>
      {toast.onAction && toast.actionLabel ? (
        <Button
          variant="solid"
          className="ml-auto"
          onClick={() => {
            toast.onAction!();
            dismissToast(toast.id);
          }}
        >
          {toast.actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)));
}

/** Pilha de avisos temporários (ex.: "Desfazer"). Ctrl/Cmd+Z executa o mais recente. */
export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !isEditable(e.target)) {
        if (runLatestToastAction()) e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex flex-col items-center gap-2 px-3 md:bottom-4"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
