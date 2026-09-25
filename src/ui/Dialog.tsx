import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { useMenuNavigation } from './useMenuNavigation';
import { useReducedMotion } from './useReducedMotion';
import { useTypewriter } from './useTypewriter';
import { Window } from './Window';

export interface DialogAction {
  label: string;
  onSelect: () => void;
  variant?: 'plain' | 'solid' | 'danger';
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Texto exibido com efeito de digitação. */
  text?: string;
  children?: ReactNode;
  actions?: DialogAction[];
  /** Retrato/sprite do NPC ao lado do texto. */
  portrait?: ReactNode;
  /** Elemento que recebe o foco ao abrir (padrão: primeira ação). */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

function TypedText({ text }: { text: string }) {
  const reduced = useReducedMotion();
  const { shown, done, skip } = useTypewriter(text, { instant: reduced });
  return (
    <p
      className="min-h-[3lh] whitespace-pre-line text-shadow-pixel"
      onClick={skip}
      data-typing={!done || undefined}
      aria-live="polite"
    >
      <span aria-hidden={!done}>{shown}</span>
      {!done ? <span className="sr-only">{text}</span> : <span className="px-caret ml-1" aria-hidden>▼</span>}
    </p>
  );
}

/**
 * Janela de diálogo modal. Esc fecha, setas escolhem a ação, Enter confirma.
 * Enquanto o texto está sendo digitado, Enter revela o texto inteiro.
 */
export function Dialog({ open, onClose, title, text, children, actions = [], portrait, initialFocusRef }: DialogProps) {
  const descId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const nav = useMenuNavigation({
    count: actions.length,
    orientation: 'horizontal',
    onSelect: (i) => actions[i]?.onSelect(),
    onCancel: onClose,
  });

  // Foco inicial na primeira ação e restauração do foco ao fechar.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      (initialFocusRef?.current ?? nav.itemRefs.current[0] ?? containerRef.current)?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="px-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-describedby={text ? descId : undefined}
        tabIndex={-1}
        className="w-full max-w-xl outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
            return;
          }
          if (e.key === 'Tab') {
            // Mantém o foco dentro do diálogo.
            const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            if (!focusables || focusables.length === 0) return;
            const first = focusables[0]!;
            const last = focusables[focusables.length - 1]!;
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <Window title={title}>
          <div className="flex gap-4">
          {portrait ? <div className="shrink-0">{portrait}</div> : null}
          <div className="min-w-0 flex-1">
            {text ? (
              <div id={descId}>
                <TypedText text={text} />
              </div>
            ) : null}
            {children}
            {actions.length > 0 ? (
              <div role="group" className="mt-3 flex flex-wrap justify-end gap-2" onKeyDown={nav.onKeyDown}>
                {actions.map((action, i) => {
                  const { ref, ...itemProps } = nav.getItemProps(i);
                  return (
                    <Button
                      key={action.label}
                      ref={ref}
                      variant={action.variant ?? 'plain'}
                      active={nav.activeIndex === i}
                      {...itemProps}
                    >
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            ) : null}
          </div>
          </div>
        </Window>
      </div>
    </div>,
    document.body,
  );
}
