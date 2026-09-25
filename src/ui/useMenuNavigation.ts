import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface MenuNavigationOptions {
  count: number;
  onSelect?: (index: number) => void;
  onCancel?: () => void;
  /** Chamado quando o cursor se move (ex.: tocar som). */
  onMove?: (index: number) => void;
  orientation?: 'vertical' | 'horizontal' | 'grid';
  /** Colunas, quando `orientation` = 'grid'. */
  columns?: number;
  loop?: boolean;
  initialIndex?: number;
  isDisabled?: (index: number) => boolean;
  /** Move o foco do DOM junto com o cursor (padrão: true). */
  focusOnMove?: boolean;
}

/**
 * Navegação de menu estilo JRPG: setas movem o cursor, Enter/Espaço confirmam,
 * Esc cancela. Implementa "roving tabindex" (só o item ativo é tabulável).
 */
export function useMenuNavigation({
  count,
  onSelect,
  onCancel,
  onMove,
  orientation = 'vertical',
  columns = 1,
  loop = true,
  initialIndex = 0,
  isDisabled,
  focusOnMove = true,
}: MenuNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState(() => Math.min(initialIndex, Math.max(0, count - 1)));
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (activeIndex > count - 1) setActiveIndex(Math.max(0, count - 1));
  }, [count, activeIndex]);

  const moveTo = useCallback(
    (index: number, focus = focusOnMove) => {
      setActiveIndex((prev) => {
        if (index !== prev) onMove?.(index);
        return index;
      });
      if (focus) itemRefs.current[index]?.focus();
    },
    [focusOnMove, onMove],
  );

  const step = useCallback(
    (from: number, delta: number): number => {
      if (count === 0) return from;
      let next = from;
      for (let i = 0; i < count; i++) {
        next += delta;
        if (next < 0 || next >= count) {
          if (!loop) return from;
          next = (next + count) % count;
        }
        if (!isDisabled?.(next)) return next;
      }
      return from;
    },
    [count, loop, isDisabled],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const vertical = orientation !== 'horizontal';
      const horizontal = orientation !== 'vertical';
      const rowStep = orientation === 'grid' ? columns : 1;
      let next: number | null = null;
      switch (e.key) {
        case 'ArrowDown':
          if (vertical) next = step(activeIndex, rowStep);
          break;
        case 'ArrowUp':
          if (vertical) next = step(activeIndex, -rowStep);
          break;
        case 'ArrowRight':
          if (horizontal) next = step(activeIndex, 1);
          break;
        case 'ArrowLeft':
          if (horizontal) next = step(activeIndex, -1);
          break;
        case 'Home':
          next = step(-1, 1);
          break;
        case 'End':
          next = step(count, -1);
          break;
        case 'Enter':
        case ' ':
          // Sem onSelect, deixa o comportamento nativo (ex.: Enter em links).
          if (onSelect && !isDisabled?.(activeIndex)) {
            e.preventDefault();
            onSelect?.(activeIndex);
          }
          return;
        case 'Escape':
          if (onCancel) {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }
          return;
        default:
          return;
      }
      if (next !== null) {
        e.preventDefault();
        moveTo(next);
      }
    },
    [orientation, columns, step, activeIndex, count, isDisabled, onSelect, onCancel, moveTo],
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
      tabIndex: index === activeIndex ? 0 : -1,
      'data-active': index === activeIndex,
      onMouseEnter: () => {
        if (!isDisabled?.(index)) moveTo(index, false);
      },
      onFocus: () => {
        if (index !== activeIndex) moveTo(index, false);
      },
      onClick: () => {
        if (!isDisabled?.(index)) {
          moveTo(index, false);
          onSelect?.(index);
        }
      },
    }),
    [activeIndex, isDisabled, moveTo, onSelect],
  );

  return { activeIndex, setActiveIndex: moveTo, onKeyDown, getItemProps, itemRefs };
}
