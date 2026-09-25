import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { HTMLAttributes, Ref } from 'react';
import { addDaysKey, formatDay } from '@/lib/date';
import { t } from '@/lib/i18n';
import type { Task, TaskList } from '@/store/types';
import { Checkbox } from '@/ui/Checkbox';
import { CursorSlot } from '@/ui/Cursor';
import { ListIcon } from '@/ui/ListIcon';
import { palette } from '@/ui/palette';
import { PixelIcon } from '@/ui/PixelIcon';
import { describeRecurrence } from '../recurrence';
import { isInMyDay, isOverdue } from '../selectors';
import { DifficultyPips } from './DifficultyPips';

const GRIP = ['##.##', '.....', '##.##', '.....', '##.##', '.....', '##.##'] as const;

export function dueLabel(dueDate: string, today: string): string {
  if (dueDate === today) return t('tasks.dueToday');
  if (dueDate === addDaysKey(today, 1)) return t('tasks.dueTomorrow');
  return formatDay(dueDate);
}

export interface TaskRowProps {
  task: Task;
  today: string;
  active: boolean;
  selected: boolean;
  sortable: boolean;
  /** Lista da tarefa, exibida nas listas inteligentes. */
  list?: TaskList;
  hideMyDayBadge?: boolean;
  onToggleComplete: () => void;
  onToggleImportant: () => void;
  openProps: HTMLAttributes<HTMLButtonElement> & { ref: Ref<HTMLButtonElement> };
}

export function TaskRow({
  task,
  today,
  active,
  selected,
  sortable,
  list,
  hideMyDayBadge,
  onToggleComplete,
  onToggleImportant,
  openProps,
}: TaskRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !sortable,
  });
  const done = Boolean(task.completedAt);
  const stepsDone = task.subtasks.filter((s) => s.done).length;
  const overdue = isOverdue(task, today);

  return (
    <li
      ref={setNodeRef}
      className="task-row"
      data-active={active || selected || undefined}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <CursorSlot visible={active} />
      {sortable ? (
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="px-icon-btn -ml-2 min-w-6! cursor-grab touch-none"
          aria-label={t('tasks.dragHandle', { title: task.title })}
          {...attributes}
          {...listeners}
        >
          <PixelIcon matrix={GRIP} colors={{ '#': palette.gray }} scale={2} />
        </button>
      ) : null}
      <Checkbox
        checked={done}
        onChange={onToggleComplete}
        label={t(done ? 'tasks.uncomplete' : 'tasks.complete', { title: task.title })}
      />
      <button type="button" className="task-open" aria-current={selected || undefined} {...openProps}>
        <span className={['block truncate text-shadow-pixel', done ? 'line-through opacity-70' : ''].join(' ')}>
          {task.title}
        </span>
        <span className="task-meta">
          {list ? (
            <span className="inline-flex items-center gap-1">
              <ListIcon icon={list.icon} color={list.color} scale={1} />
              {list.name}
            </span>
          ) : null}
          {!hideMyDayBadge && isInMyDay(task, today) ? (
            <span className="inline-flex items-center gap-1">
              <ListIcon icon="sun" color={palette.gold} scale={1} />
              {t('tasks.inMyDay')}
            </span>
          ) : null}
          {task.dueDate ? (
            <span
              className={overdue ? 'px-chip text-win-text' : undefined}
              style={overdue ? { borderColor: palette.hpRed } : undefined}
            >
              {overdue ? `${t('tasks.overdue')} · ` : ''}
              {dueLabel(task.dueDate, today)}
            </span>
          ) : null}
          {task.recurrence ? <span>↻ {describeRecurrence(task.recurrence)}</span> : null}
          {task.subtasks.length > 0 ? (
            <span>{t('tasks.subtaskProgress', { done: stepsDone, total: task.subtasks.length })}</span>
          ) : null}
          {task.reminderAt && !done ? <span aria-hidden>⏰</span> : null}
          {task.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </span>
      </button>
      <DifficultyPips difficulty={task.difficulty} />
      <button
        type="button"
        className="px-icon-btn"
        aria-pressed={task.important}
        aria-label={t(task.important ? 'tasks.unmarkImportant' : 'tasks.markImportant')}
        onClick={onToggleImportant}
      >
        <ListIcon icon="star" color={task.important ? palette.gold : palette.slate} scale={2} />
      </button>
    </li>
  );
}
