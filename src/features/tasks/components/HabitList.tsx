import type { KeyboardEvent } from 'react';
import { t } from '@/lib/i18n';
import type { Task } from '@/store/types';
import { CursorSlot } from '@/ui/Cursor';
import { useMenuNavigation } from '@/ui/useMenuNavigation';
import { useTaskCommands } from '../useTaskCommands';
import { DifficultyPips } from './DifficultyPips';

function HabitButton({ sign, label, onPress }: { sign: '+' | '−'; label: string; onPress: (el: HTMLElement) => void }) {
  return (
    <button
      type="button"
      className="px-check font-title size-8! text-[0.8rem]"
      style={{ color: sign === '+' ? '#38d038' : '#ff8078' }}
      aria-label={label}
      onClick={(e) => onPress(e.currentTarget)}
    >
      {sign}
    </button>
  );
}

export interface HabitListProps {
  habits: Task[];
  today: string;
  selectedId?: string;
  onOpen: (id: string) => void;
  'aria-label': string;
}

/** Hábitos com botões + / − (várias vezes ao dia). Teclas + e − agem no hábito focado. */
export function HabitList({ habits, today, selectedId, onOpen, ...aria }: HabitListProps) {
  const commands = useTaskCommands();
  const nav = useMenuNavigation({ count: habits.length, onSelect: (i) => onOpen(habits[i]!.id) });

  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (!target.dataset.navItem) return;
    const habit = habits[Number(target.dataset.navItem)];
    if (!habit) return;
    const direction = habit.habitDirection ?? 'both';
    if ((e.key === '+' || e.key === '=') && direction !== 'down') {
      e.preventDefault();
      commands.habitUp(habit.id, target);
      return;
    }
    if ((e.key === '-' || e.key === '_') && direction !== 'up') {
      e.preventDefault();
      commands.habitDown(habit.id, target);
      return;
    }
    nav.onKeyDown(e);
  };

  return (
    <ul aria-label={aria['aria-label']} className="flex flex-col gap-1" onKeyDown={onKeyDown}>
      {habits.map((habit, i) => {
        const counts = habit.habitCounts && habit.habitCounts.date === today ? habit.habitCounts : { up: 0, down: 0 };
        const direction = habit.habitDirection ?? 'both';
        const { ref, onClick, onFocus, onMouseEnter, tabIndex } = nav.getItemProps(i);
        return (
          <li
            key={habit.id}
            className="task-row"
            data-active={nav.activeIndex === i || habit.id === selectedId || undefined}
          >
            <CursorSlot visible={nav.activeIndex === i} />
            {direction !== 'down' ? (
              <HabitButton
                sign="+"
                label={t('tasks.habit.up.label', { title: habit.title })}
                onPress={(el) => commands.habitUp(habit.id, el)}
              />
            ) : null}
            <button
              type="button"
              className="task-open"
              data-nav-item={i}
              aria-current={habit.id === selectedId || undefined}
              {...{ ref, onClick, onFocus, onMouseEnter, tabIndex }}
            >
              <span className="block truncate text-shadow-pixel">{habit.title}</span>
              <span className="task-meta">
                <span>{t('tasks.habit.counts', { up: counts.up, down: counts.down })}</span>
                {habit.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </span>
            </button>
            <DifficultyPips difficulty={habit.difficulty} />
            {direction !== 'up' ? (
              <HabitButton
                sign="−"
                label={t('tasks.habit.down.label', { title: habit.title })}
                onPress={(el) => commands.habitDown(habit.id, el)}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
