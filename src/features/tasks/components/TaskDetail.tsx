import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { addDaysKey, dayOf, formatDay } from '@/lib/date';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import type { Recurrence, Task, Weekday } from '@/store/types';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { ListIcon } from '@/ui/ListIcon';
import { palette } from '@/ui/palette';
import { Window } from '@/ui/Window';
import { difficulties } from '../constants';
import { weekdayShort } from '../recurrence';
import { useToday } from '../useToday';
import { requestNotificationPermission } from '../useReminders';
import { useTaskCommands } from '../useTaskCommands';

type RecurrenceType = Recurrence['type'] | 'none';
const recurrenceTypes: RecurrenceType[] = ['none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly', 'everyNDays'];
const recurrenceLabel = {
  none: 'tasks.recurrence.none',
  daily: 'tasks.recurrence.daily',
  weekdays: 'tasks.recurrence.weekdays',
  weekly: 'tasks.recurrence.weekly',
  monthly: 'tasks.recurrence.monthly',
  yearly: 'tasks.recurrence.yearly',
  everyNDays: 'tasks.recurrence.everyNDays',
} as const;

function recurrenceFor(type: RecurrenceType, current?: Recurrence): Recurrence | undefined {
  switch (type) {
    case 'none':
      return undefined;
    case 'weekly':
      return { type, days: current?.type === 'weekly' ? current.days : [] };
    case 'everyNDays':
      return { type, interval: current?.type === 'everyNDays' ? current.interval : 2 };
    default:
      return { type };
  }
}

/** Campo de texto que só grava ao sair ou apertar Enter. */
function CommitInput({
  value,
  onCommit,
  multiline,
  ...rest
}: {
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  const common = {
    ...rest,
    value: draft,
    onBlur: commit,
    className: ['px-input', rest.className].filter(Boolean).join(' '),
  };
  if (multiline) {
    return <textarea {...common} rows={4} onChange={(e) => setDraft(e.target.value)} />;
  }
  return (
    <input
      {...common}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
        if (e.key === 'Escape') setDraft(value);
      }}
    />
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="font-title text-[0.55rem] text-win-accent text-shadow-pixel">
        {label}
      </label>
      {children}
    </div>
  );
}

export interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

/** Painel de detalhes: título, passos, datas, recorrência, dificuldade, lista, tags e notas. */
export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const store = useGameStore.getState;
  const lists = useGameStore((s) => s.lists);
  const commands = useTaskCommands();
  const today = useToday();
  const ids = { title: useId(), due: useId(), reminder: useId(), recurrence: useId(), difficulty: useId(), list: useId(), tags: useId(), notes: useId(), step: useId(), interval: useId() };
  const [newStep, setNewStep] = useState('');
  const [newTag, setNewTag] = useState('');
  const [reminderDenied, setReminderDenied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const update = (patch: Partial<Task>) => store().updateTask(task.id, patch);
  const done = Boolean(task.completedAt);
  const recurrenceType: RecurrenceType = task.recurrence?.type ?? 'none';

  useEffect(() => {
    panelRef.current?.focus();
  }, [task.id]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !(e.target as HTMLElement).matches('input, textarea, select')) {
      e.stopPropagation();
      onClose();
    }
  };

  const setDue = (dueDate: string | undefined) => {
    if (!dueDate) update({ dueDate: undefined, recurrence: undefined });
    else update({ dueDate });
  };

  const setRecurrence = (type: RecurrenceType) => {
    const recurrence = recurrenceFor(type, task.recurrence);
    // Recorrência precisa de uma data de referência.
    update({ recurrence, dueDate: recurrence && !task.dueDate ? today : task.dueDate });
  };

  const addTag = () => {
    const tag = newTag.trim().replace(/^#/, '').replace(/\s+/g, '-');
    if (tag && !task.tags.includes(tag)) update({ tags: [...task.tags, tag] });
    setNewTag('');
  };

  return (
    <div ref={panelRef} tabIndex={-1} onKeyDown={onKeyDown} className="outline-none" aria-label={t('tasks.detail.title')} role="region">
      <Window className="flex flex-col gap-4">
        <div className="flex items-start gap-2">
          <Checkbox
            checked={done}
            onChange={() => commands.toggleComplete(task.id)}
            label={t(done ? 'tasks.uncomplete' : 'tasks.complete', { title: task.title })}
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            <label htmlFor={ids.title} className="sr-only">
              {t('tasks.detail.name')}
            </label>
            <CommitInput
              id={ids.title}
              value={task.title}
              onCommit={(title) => title.trim() && update({ title: title.trim() })}
              className="text-2xl"
            />
          </div>
          <button
            type="button"
            className="px-icon-btn"
            aria-pressed={task.important}
            aria-label={t(task.important ? 'tasks.unmarkImportant' : 'tasks.markImportant')}
            onClick={() => store().toggleImportant(task.id)}
          >
            <ListIcon icon="star" color={task.important ? palette.gold : palette.slate} scale={2} />
          </button>
          <button type="button" className="px-icon-btn font-title text-[0.7rem]" aria-label={t('tasks.detail.close')} onClick={onClose}>
            ✕
          </button>
        </div>

        <Field label={t('tasks.detail.steps')} htmlFor={ids.step}>
          <ul className="flex flex-col gap-1">
            {task.subtasks.map((step) => (
              <li key={step.id} className="flex items-center gap-2">
                <Checkbox
                  checked={step.done}
                  onChange={(v) => store().updateSubtask(task.id, step.id, { done: v })}
                  label={t('tasks.detail.stepDone', { title: step.title })}
                />
                <CommitInput
                  value={step.title}
                  aria-label={t('tasks.detail.steps')}
                  onCommit={(title) =>
                    title.trim()
                      ? store().updateSubtask(task.id, step.id, { title: title.trim() })
                      : store().deleteSubtask(task.id, step.id)
                  }
                  className={step.done ? 'line-through opacity-70' : undefined}
                />
                <button
                  type="button"
                  className="px-icon-btn"
                  aria-label={t('tasks.detail.removeStep', { title: step.title })}
                  onClick={() => store().deleteSubtask(task.id, step.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              store().addSubtask(task.id, newStep);
              setNewStep('');
            }}
          >
            <input
              id={ids.step}
              className="px-input"
              placeholder={`+ ${t('tasks.detail.addStep')}`}
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
            />
          </form>
        </Field>

        <Button variant="solid" onClick={() => store().toggleMyDay(task.id)} aria-pressed={task.myDayDate === today}>
          <ListIcon icon="sun" color={palette.gold} scale={1} />
          {t(task.myDayDate === today ? 'tasks.detail.removeMyDay' : 'tasks.detail.myDay')}
        </Button>

        <Field label={t('tasks.detail.dueDate')} htmlFor={ids.due}>
          <input
            id={ids.due}
            type="date"
            className="px-input"
            value={task.dueDate ?? ''}
            onChange={(e) => setDue(e.target.value || undefined)}
          />
          <div className="flex flex-wrap gap-1">
            <Button onClick={() => setDue(today)}>{t('tasks.detail.today')}</Button>
            <Button onClick={() => setDue(addDaysKey(today, 1))}>{t('tasks.detail.tomorrow')}</Button>
            <Button onClick={() => setDue(addDaysKey(today, 7))}>{t('tasks.detail.nextWeek')}</Button>
            {task.dueDate ? <Button onClick={() => setDue(undefined)}>{t('tasks.detail.clear')}</Button> : null}
          </div>
        </Field>

        <Field label={t('tasks.detail.recurrence')} htmlFor={ids.recurrence}>
          <select
            id={ids.recurrence}
            className="px-input"
            value={recurrenceType}
            onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
          >
            {recurrenceTypes.map((type) => (
              <option key={type} value={type}>
                {t(recurrenceLabel[type])}
              </option>
            ))}
          </select>
          {task.recurrence?.type === 'weekly' ? (
            <div className="flex flex-wrap gap-1" role="group" aria-label={t('tasks.recurrence.weekly')}>
              {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((day) => {
                const days = task.recurrence?.type === 'weekly' ? task.recurrence.days : [];
                const on = days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className="px-icon-btn"
                    aria-pressed={on}
                    onClick={() =>
                      update({
                        recurrence: { type: 'weekly', days: on ? days.filter((d) => d !== day) : [...days, day] },
                      })
                    }
                  >
                    {weekdayShort(day)}
                  </button>
                );
              })}
            </div>
          ) : null}
          {task.recurrence?.type === 'everyNDays' ? (
            <div className="flex items-center gap-2">
              <label htmlFor={ids.interval}>{t('tasks.recurrence.interval')}</label>
              <input
                id={ids.interval}
                type="number"
                min={1}
                max={365}
                className="px-input w-20!"
                value={task.recurrence.interval}
                onChange={(e) =>
                  update({
                    recurrence: { type: 'everyNDays', interval: Math.min(365, Math.max(1, Number(e.target.value) || 1)) },
                  })
                }
              />
            </div>
          ) : null}
        </Field>

        <Field label={t('tasks.detail.reminder')} htmlFor={ids.reminder}>
          <div className="flex gap-1">
            <input
              id={ids.reminder}
              type="datetime-local"
              className="px-input"
              value={task.reminderAt ?? ''}
              onChange={async (e) => {
                const value = e.target.value || undefined;
                update({ reminderAt: value, reminderFiredAt: undefined });
                if (value) {
                  const permission = await requestNotificationPermission();
                  setReminderDenied(permission !== 'granted');
                }
              }}
            />
            {task.reminderAt ? (
              <Button onClick={() => update({ reminderAt: undefined, reminderFiredAt: undefined })}>
                {t('tasks.detail.clear')}
              </Button>
            ) : null}
          </div>
          {reminderDenied ? <p className="text-win-dim">{t('tasks.detail.reminderDenied')}</p> : null}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('tasks.difficulty')} htmlFor={ids.difficulty}>
            <select
              id={ids.difficulty}
              className="px-input"
              value={task.difficulty}
              onChange={(e) => update({ difficulty: e.target.value as Task['difficulty'] })}
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  {t(`tasks.difficulty.${d}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('tasks.detail.list')} htmlFor={ids.list}>
            <select
              id={ids.list}
              className="px-input"
              value={task.listId}
              onChange={(e) => store().moveTask(task.id, e.target.value)}
            >
              {[...lists]
                .sort((a, b) => a.order - b.order)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>

        <Field label={t('tasks.detail.tags')} htmlFor={ids.tags}>
          {task.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <li key={tag} className="px-chip">
                  #{tag}
                  <button
                    type="button"
                    className="px-1"
                    aria-label={t('tasks.detail.removeTag', { tag })}
                    onClick={() => update({ tags: task.tags.filter((x) => x !== tag) })}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <input
            id={ids.tags}
            className="px-input"
            placeholder={t('tasks.detail.addTag')}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
          />
        </Field>

        <Field label={t('tasks.detail.notes')} htmlFor={ids.notes}>
          <CommitInput
            id={ids.notes}
            multiline
            value={task.notes ?? ''}
            placeholder={t('tasks.detail.notesPlaceholder')}
            onCommit={(notes) => update({ notes: notes || undefined })}
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-white/10 pt-3 text-win-dim">
          <span>
            {done
              ? t('tasks.detail.completedAt', { date: formatDay(dayOf(task.completedAt!)) })
              : t('tasks.detail.created', { date: formatDay(dayOf(task.createdAt)) })}
          </span>
          <Button
            variant="danger"
            onClick={() => {
              commands.remove(task.id);
              onClose();
            }}
          >
            {t('tasks.detail.delete')}
          </Button>
        </div>
      </Window>
    </div>
  );
}
