import { useEffect, useId, type ReactNode } from 'react';
import { useMenuNavigation } from './useMenuNavigation';

export interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
}

export interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  'aria-label': string;
  children?: ReactNode;
  className?: string;
}

/** Abas com navegação por setas esquerda/direita (a aba segue o foco). */
export function Tabs<T extends string>({ tabs, value, onChange, children, className, ...aria }: TabsProps<T>) {
  const baseId = useId();
  const selectedIndex = Math.max(0, tabs.findIndex((t) => t.id === value));
  const nav = useMenuNavigation({
    count: tabs.length,
    orientation: 'horizontal',
    initialIndex: selectedIndex,
    onMove: (i) => onChange(tabs[i]!.id),
    onSelect: (i) => onChange(tabs[i]!.id),
  });
  const { activeIndex, setActiveIndex } = nav;
  useEffect(() => {
    if (activeIndex !== selectedIndex) setActiveIndex(selectedIndex, false);
    // Sincroniza só quando o valor controlado muda de fora.
  }, [selectedIndex]);
  return (
    <div className={className}>
      <div role="tablist" aria-label={aria['aria-label']} className="flex flex-wrap gap-1" onKeyDown={nav.onKeyDown}>
        {tabs.map((tab, i) => {
          const selected = tab.id === value;
          const { ref, onMouseEnter: _hover, ...itemProps } = nav.getItemProps(i);
          return (
            <button
              key={tab.id}
              ref={ref}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              className="px-tab"
              {...itemProps}
              tabIndex={selected ? 0 : -1}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${value}`} className="pt-3">
        {children}
      </div>
    </div>
  );
}
