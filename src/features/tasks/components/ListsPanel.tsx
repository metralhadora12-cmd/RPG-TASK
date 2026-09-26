import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import type { ListGroup, Task, TaskList } from '@/store/types';
import { Button } from '@/ui/Button';
import { CursorSlot } from '@/ui/Cursor';
import { ListIcon } from '@/ui/ListIcon';
import { palette } from '@/ui/palette';
import { smartViews, type SmartViewId } from '../constants';
import { dndAccessibility, reorderedIds, useSortableSensors } from '../dnd';
import { countOpen } from '../selectors';
import { useToday } from '../useToday';
import { searchPath, viewPath } from '../viewRoutes';
import { GroupEditDialog } from './GroupEditDialog';
import { ListEditDialog } from './ListEditDialog';

const smartColors: Record<SmartViewId, string> = {
  'my-day': palette.gold,
  dailies: palette.sky,
  habits: palette.hpRed,
  important: palette.hpYellow,
  planned: palette.sky,
  all: palette.frost,
  completed: palette.hpGreen,
};

function Count({ n }: { n: number }) {
  return n > 0 ? <span className="ml-auto pl-2 tabular-nums text-win-dim">{n}</span> : null;
}

function SortableListRow({
  list,
  count,
  onEdit,
  onNavigate,
}: {
  list: TaskList;
  count: number;
  onEdit: () => void;
  onNavigate?: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
  });
  return (
    <li
      ref={setNodeRef}
      className="group flex items-center"
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
    >
      <NavLink
        to={viewPath({ type: 'list', id: list.id })}
        className="px-menu-item min-w-0 flex-1"
        data-panel-link
        onClick={onNavigate}
      >
        <CursorSlot visible="css" />
        <ListIcon icon={list.icon} color={list.color} scale={2} className="mr-2 shrink-0" />
        <span className="truncate">{list.name}</span>
        <Count n={count} />
      </NavLink>
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="px-icon-btn min-w-6! cursor-grab touch-none text-win-dim md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        aria-label={t('lists.dragHandle', { name: list.name })}
        {...attributes}
        {...listeners}
      >
        ⋮
      </button>
      <button
        type="button"
        className="px-icon-btn min-w-6! text-win-dim md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        aria-label={t('lists.editNamed', { name: list.name })}
        onClick={onEdit}
      >
        ✎
      </button>
    </li>
  );
}

function SortableLists({
  lists,
  tasks,
  today,
  onEdit,
  onNavigate,
}: {
  lists: TaskList[];
  tasks: Task[];
  today: string;
  onEdit: (id: string) => void;
  onNavigate?: () => void;
}) {
  const reorderLists = useGameStore((s) => s.reorderLists);
  const sensors = useSortableSensors();
  const ids = lists.map((l) => l.id);
  const onDragEnd = (event: DragEndEvent) => {
    const next = reorderedIds(ids, event);
    if (next) reorderLists(next);
  };
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd} accessibility={dndAccessibility()}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-0.5">
          {lists.map((list) => (
            <SortableListRow
              key={list.id}
              list={list}
              count={countOpen(tasks, { type: 'list', id: list.id }, { today })}
              onEdit={() => onEdit(list.id)}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function GroupSection({
  group,
  children,
  onEdit,
}: {
  group: ListGroup;
  children: ReactNode;
  onEdit: () => void;
}) {
  const updateGroup = useGameStore((s) => s.updateGroup);
  return (
    <li className="mt-1">
      <div className="flex items-center">
        <button
          type="button"
          className="px-menu-item min-w-0 flex-1 text-win-dim"
          aria-expanded={!group.collapsed}
          aria-label={t('lists.group.toggle', { name: group.name })}
          onClick={() => updateGroup(group.id, { collapsed: !group.collapsed })}
          data-panel-link
        >
          <CursorSlot visible="css" />
          <span aria-hidden className="mr-2 inline-block w-3">
            {group.collapsed ? '▸' : '▾'}
          </span>
          <span className="truncate" aria-hidden>
            {group.name}
          </span>
        </button>
        <button
          type="button"
          className="px-icon-btn min-w-6! text-win-dim"
          aria-label={t('lists.group.edit', { name: group.name })}
          onClick={onEdit}
        >
          ✎
        </button>
      </div>
      {group.collapsed ? null : <div className="pl-3">{children}</div>}
    </li>
  );
}

/** Setas ↑/↓ movem o foco entre os links do painel. */
function onPanelKeyDown(e: KeyboardEvent<HTMLElement>) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const target = e.target as HTMLElement;
  if (!target.hasAttribute('data-panel-link')) return;
  const links = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-panel-link]'));
  const i = links.indexOf(target);
  const next = links[(i + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length];
  if (next) {
    e.preventDefault();
    next.focus();
  }
}

export interface ListsPanelProps {
  /** Chamado ao escolher uma visão (usado no mobile). */
  onNavigate?: () => void;
}

/** Busca, listas inteligentes, grupos e listas do usuário. */
export function ListsPanel({ onNavigate }: ListsPanelProps) {
  const tasks = useGameStore((s) => s.tasks);
  const lists = useGameStore((s) => s.lists);
  const groups = useGameStore((s) => s.groups);
  const today = useToday();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ type: 'list' | 'group'; id: string; isNew?: boolean } | null>(null);

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.order - b.order), [groups]);
  const listsIn = (groupId: string) => lists.filter((l) => l.groupId === groupId).sort((a, b) => a.order - b.order);
  // Listas cujo grupo não existe mais aparecem como sem grupo.
  const ungrouped = lists
    .filter((l) => !l.groupId || !groups.some((g) => g.id === l.groupId))
    .sort((a, b) => a.order - b.order);

  const newList = () => {
    // Só navega ao fechar o diálogo: no mobile a navegação desmontaria este painel.
    setEditing({ type: 'list', id: useGameStore.getState().createList(), isNew: true });
  };
  const newGroup = () => setEditing({ type: 'group', id: useGameStore.getState().createGroup() });

  return (
    <div className="flex flex-col gap-3" onKeyDown={onPanelKeyDown}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(searchPath(query.trim()));
          onNavigate?.();
        }}
      >
        <label htmlFor="task-search" className="sr-only">
          {t('tasks.search.label')}
        </label>
        <input
          id="task-search"
          data-task-search
          type="search"
          className="px-input"
          placeholder={t('tasks.search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <nav aria-label={t('tasks.smartLists')}>
        <ul className="flex flex-col gap-0.5">
          {smartViews.map((view) => (
            <li key={view.id}>
              <NavLink
                to={viewPath({ type: 'smart', id: view.id })}
                className="px-menu-item"
                data-panel-link
                onClick={onNavigate}
              >
                <CursorSlot visible="css" />
                <ListIcon icon={view.icon} color={smartColors[view.id]} scale={2} className="mr-2 shrink-0" />
                <span className="truncate">{t(view.label)}</span>
                <Count n={countOpen(tasks, { type: 'smart', id: view.id }, { today })} />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label={t('tasks.lists')} className="border-t-2 border-white/10 pt-2">
        <SortableLists
          lists={ungrouped}
          tasks={tasks}
          today={today}
          onEdit={(id) => setEditing({ type: 'list', id })}
          onNavigate={onNavigate}
        />
        {sortedGroups.length > 0 ? (
          <ul>
            {sortedGroups.map((group) => (
              <GroupSection key={group.id} group={group} onEdit={() => setEditing({ type: 'group', id: group.id })}>
                <SortableLists
                  lists={listsIn(group.id)}
                  tasks={tasks}
                  today={today}
                  onEdit={(id) => setEditing({ type: 'list', id })}
                  onNavigate={onNavigate}
                />
              </GroupSection>
            ))}
          </ul>
        ) : null}
      </nav>

      <div className="flex flex-wrap gap-1">
        <Button variant="solid" onClick={newList}>
          + {t('lists.new')}
        </Button>
        <Button onClick={newGroup}>+ {t('lists.newGroup')}</Button>
      </div>

      {editing?.type === 'list' ? (
        <ListEditDialog
          listId={editing.id}
          onClose={() => {
            setEditing(null);
            if (editing.isNew && useGameStore.getState().lists.some((l) => l.id === editing.id)) {
              navigate(viewPath({ type: 'list', id: editing.id }));
              onNavigate?.();
            }
          }}
          onDeleted={() => navigate(viewPath({ type: 'smart', id: 'my-day' }))}
        />
      ) : null}
      {editing?.type === 'group' ? <GroupEditDialog groupId={editing.id} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
