import type { ReactNode } from 'react';
import { CursorSlot } from './Cursor';
import { useMenuNavigation } from './useMenuNavigation';

export interface MenuItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}

export interface MenuProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
  onCancel?: () => void;
  onMove?: (item: MenuItem) => void;
  'aria-label': string;
  orientation?: 'vertical' | 'horizontal';
  initialIndex?: number;
  className?: string;
}

/** Lista de opções com cursor de mãozinha, navegável por setas/Enter/Esc. */
export function Menu({ items, onSelect, onCancel, onMove, orientation = 'vertical', initialIndex, className, ...aria }: MenuProps) {
  const nav = useMenuNavigation({
    count: items.length,
    orientation,
    initialIndex,
    isDisabled: (i) => Boolean(items[i]?.disabled),
    onSelect: (i) => onSelect(items[i]!),
    onMove: onMove ? (i) => onMove(items[i]!) : undefined,
    onCancel,
  });
  return (
    <ul
      role="menu"
      aria-label={aria['aria-label']}
      aria-orientation={orientation}
      className={[orientation === 'horizontal' ? 'flex flex-wrap gap-1' : 'flex flex-col gap-0.5', className]
        .filter(Boolean)
        .join(' ')}
      onKeyDown={nav.onKeyDown}
    >
      {items.map((item, i) => (
        <li key={item.id} role="none">
          <button
            type="button"
            role="menuitem"
            className="px-menu-item"
            aria-disabled={item.disabled || undefined}
            {...nav.getItemProps(i)}
          >
            <CursorSlot visible={nav.activeIndex === i} />
            {item.icon ? <span className="mr-2 inline-flex">{item.icon}</span> : null}
            <span className={item.disabled ? 'opacity-50' : undefined}>{item.label}</span>
            {item.hint ? <span className="ml-auto pl-3 text-win-dim">{item.hint}</span> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
