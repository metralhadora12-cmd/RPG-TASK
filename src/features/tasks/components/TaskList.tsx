import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo, type KeyboardEvent } from 'react';
import { useGameStore } from '@/store/useGameStore';
import type { Task } from '@/store/types';
import { useMenuNavigation } from '@/ui/useMenuNavigation';
import { dndAccessibility, reorderedIds, useSortableSensors } from '../dnd';
import { useTaskCommands } from '../useTaskCommands';
import { TaskRow } from './TaskRow';

export interface TaskSection {
  id: string;
  label?: string;
  tasks: Task[];
}

export interface TaskListProps {
  sections: TaskSection[];
  today: string;
  /** Habilita arrastar e soltar (apenas com uma seção e ordenação manual). */
  sortable?: boolean;
  showListName?: boolean;
  hideMyDayBadge?: boolean;
  selectedId?: string;
  onOpen: (id: string) => void;
  'aria-label': string;
}

/**
 * Lista de missões navegável por teclado:
 * setas movem, Enter abre, Espaço conclui, S marca importante, Delete exclui.
 */
export function TaskList({
  sections,
  today,
  sortable = false,
  showListName = false,
  hideMyDayBadge = false,
  selectedId,
  onOpen,
  ...aria
}: TaskListProps) {
  const lists = useGameStore((s) => s.lists);
  const toggleImportant = useGameStore((s) => s.toggleImportant);
  const reorderTasks = useGameStore((s) => s.reorderTasks);
  const commands = useTaskCommands();
  const sensors = useSortableSensors();
  const flat = useMemo(() => sections.flatMap((s) => s.tasks), [sections]);
  const listById = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);
  const canSort = sortable && sections.length === 1;

  const nav = useMenuNavigation({ count: flat.length, onSelect: (i) => onOpen(flat[i]!.id) });

  /** Mantém o foco num item vizinho depois que uma linha sai da lista. */
  const refocus = (index: number) =>
    requestAnimationFrame(() => {
      const items = nav.itemRefs.current.slice(0, Math.max(0, flat.length - 1));
      const target = items[Math.min(index, items.length - 1)];
      if (target) {
        target.focus();
        nav.setActiveIndex(Math.min(index, items.length - 1), false);
      }
    });

  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (!target.dataset.navItem) return; // teclas em botões internos/alça de arrastar
    const index = Number(target.dataset.navItem);
    const task = flat[index];
    if (!task) return;
    if (e.key === ' ') {
      e.preventDefault();
      const leaves = !task.completedAt;
      commands.toggleComplete(task.id);
      if (leaves) refocus(index);
      return;
    }
    if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggleImportant(task.id);
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      commands.remove(task.id);
      refocus(index);
      return;
    }
    nav.onKeyDown(e);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const next = reorderedIds(
      flat.map((t) => t.id),
      event,
    );
    if (next) reorderTasks(next);
  };

  let index = -1;
  const body = (
    <ul aria-label={aria['aria-label']} className="flex flex-col gap-1" onKeyDown={onKeyDown}>
      {sections.map((section) => [
        section.label && section.tasks.length > 0 ? (
          <li key={`h-${section.id}`} role="presentation" className="font-title mt-2 text-[0.6rem] text-win-accent first:mt-0">
            {section.label} ({section.tasks.length})
          </li>
        ) : null,
        ...section.tasks.map((task) => {
          index += 1;
          const i = index;
          const { ref, onClick, onFocus, onMouseEnter, tabIndex } = nav.getItemProps(i);
          return (
            <TaskRow
              key={task.id}
              task={task}
              today={today}
              active={nav.activeIndex === i}
              selected={task.id === selectedId}
              sortable={canSort}
              list={showListName ? listById.get(task.listId) : undefined}
              hideMyDayBadge={hideMyDayBadge}
              onToggleComplete={() => commands.toggleComplete(task.id)}
              onToggleImportant={() => toggleImportant(task.id)}
              openProps={{
                ref,
                onClick,
                onFocus,
                onMouseEnter,
                tabIndex,
                ...({ 'data-nav-item': i } as object),
              }}
            />
          );
        }),
      ])}
    </ul>
  );

  if (!canSort) return body;
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd} accessibility={dndAccessibility()}>
      <SortableContext items={flat.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {body}
      </SortableContext>
    </DndContext>
  );
}
