import { useEffect, useId, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { formatDay } from '@/lib/date';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import type { Difficulty, SortMode, Task } from '@/store/types';
import { Button } from '@/ui/Button';
import { ListIcon } from '@/ui/ListIcon';
import { palette } from '@/ui/palette';
import { useMediaQuery } from '@/ui/useMediaQuery';
import { Window } from '@/ui/Window';
import { smartViews, sortModes } from '../constants';
import {
  groupPlanned,
  myDaySuggestions,
  plannedBuckets,
  searchTasks,
  selectViewTasks,
  sortTasks,
  type ViewRef,
  type ViewTasks,
} from '../selectors';
import { useToday } from '../useToday';
import { QUESTS_BASE, searchPath, viewFromSlug, viewKey } from '../viewRoutes';
import { AddTaskBar } from './AddTaskBar';
import { ListEditDialog } from './ListEditDialog';
import { ListsPanel } from './ListsPanel';
import { TaskDetail } from './TaskDetail';
import { TaskList, type TaskSection } from './TaskList';

type Source = ViewRef | { type: 'search' };

function selectSource(tasks: Task[], source: Source | null, query: string, today: string): ViewTasks {
  if (!source) return { open: [], done: [] };
  if (source.type === 'search') {
    const found = searchTasks(
      tasks.filter((x) => x.kind !== 'habit'),
      query,
    );
    return { open: found.filter((x) => !x.completedAt), done: found.filter((x) => x.completedAt) };
  }
  return selectViewTasks(tasks, source, { today });
}

function isEditable(el: Element | null) {
  return Boolean(el && (el.matches('input, textarea, select') || (el as HTMLElement).isContentEditable));
}

/** Atalho "/" para buscar e "N" para nova missão. */
function useQuestShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isEditable(document.activeElement)) return;
      if (e.key === '/') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('[data-task-search]');
        if (input && input.offsetParent !== null) input.focus();
        else navigate(searchPath(''));
      } else if (e.key.toLowerCase() === 'n' && !document.querySelector('[role="dialog"]')) {
        const input = document.querySelector<HTMLInputElement>('[data-add-task]');
        if (input) {
          e.preventDefault();
          input.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);
}

export function QuestsPage({ search = false }: { search?: boolean }) {
  const { slug, listId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tasks = useGameStore((s) => s.tasks);
  const lists = useGameStore((s) => s.lists);
  const viewPrefs = useGameStore((s) => s.viewPrefs);
  const weekStartsOn = useGameStore((s) => s.settings.weekStartsOn);
  const today = useToday();
  const wide = useMediaQuery('(min-width: 1280px)');
  const [showDone, setShowDone] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingList, setEditingList] = useState(false);
  const sortId = useId();
  const query = params.get('q') ?? '';
  const selectedId = params.get('tarefa') ?? undefined;
  useQuestShortcuts();

  const source: Source | null = search
    ? { type: 'search' }
    : listId
      ? { type: 'list', id: listId }
      : viewFromSlug(slug);
  const list = source?.type === 'list' ? lists.find((l) => l.id === source.id) : undefined;
  const key = source ? viewKey(source) : '';
  const sortMode: SortMode = viewPrefs[key] ?? 'manual';

  const viewTasks = selectSource(tasks, source, query, today);

  if (!source || (source.type === 'list' && !list)) return <Navigate to={`${QUESTS_BASE}/meu-dia`} replace />;

  const smart = source.type === 'smart' ? smartViews.find((v) => v.id === source.id)! : undefined;
  const isPlanned = source.type === 'smart' && source.id === 'planned';
  const isCompleted = source.type === 'smart' && source.id === 'completed';
  const isMyDay = source.type === 'smart' && source.id === 'my-day';
  const title = source.type === 'search' ? t('tasks.view.search') : list ? list.name : t(smart!.label);
  const selectedTask = selectedId ? tasks.find((x) => x.id === selectedId) : undefined;

  const open = (id: string) =>
    setParams((p) => {
      p.set('tarefa', id);
      return p;
    });
  const closeDetail = () =>
    setParams((p) => {
      p.delete('tarefa');
      return p;
    });

  const addTask = (taskTitle: string, difficulty: Difficulty) => {
    useGameStore.getState().addTask({
      title: taskTitle,
      difficulty,
      listId: list?.id,
      myDay: isMyDay,
      important: source.type === 'smart' && source.id === 'important',
      dueDate: isPlanned ? today : undefined,
    });
  };

  const openSections: TaskSection[] = isPlanned
    ? (() => {
        const groups = groupPlanned(viewTasks.open, today, weekStartsOn);
        return plannedBuckets.map((b) => ({ id: b, label: t(`tasks.planned.${b}`), tasks: groups[b] }));
      })()
    : [{ id: 'open', tasks: sortTasks(viewTasks.open, sortMode) }];
  const hasOpen = openSections.some((s) => s.tasks.length > 0);
  const suggestions = isMyDay ? myDaySuggestions(tasks, today) : [];

  const main = (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <Window as="header" className="flex flex-wrap items-center gap-3">
        <Link to={`${QUESTS_BASE}/listas`} className="px-icon-btn md:hidden" aria-label={t('tasks.backToLists')}>
          ◂
        </Link>
        {list ? (
          <ListIcon icon={list.icon} color={list.color} scale={3} />
        ) : smart ? (
          <ListIcon icon={smart.icon} color={palette.gold} scale={3} />
        ) : null}
        <div className="min-w-0 flex-1 basis-40">
          <h1 className="font-title truncate text-sm text-win-accent text-shadow-pixel">{title}</h1>
          {isMyDay ? <p className="text-win-dim first-letter:uppercase">{formatDay(today, "EEEE, d 'de' MMMM")}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {list ? (
            <Button onClick={() => setEditingList(true)} aria-label={t('lists.editNamed', { name: list.name })}>
              ✎ {t('lists.edit')}
            </Button>
          ) : null}
          {!isPlanned && !isCompleted ? (
            <div className="flex items-center gap-2">
              <label htmlFor={sortId} className="text-win-dim">
                {t('tasks.sort.label')}
              </label>
              <select
                id={sortId}
                className="px-input w-auto!"
                value={sortMode}
                onChange={(e) => useGameStore.getState().setViewSort(key, e.target.value as SortMode)}
              >
                {sortModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {t(`tasks.sort.${mode}`)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        {source.type === 'search' ? (
          <form
            role="search"
            className="w-full"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="task-search-page" className="sr-only">
              {t('tasks.search.label')}
            </label>
            <input
              id="task-search-page"
              data-task-search
              type="search"
              autoFocus
              className="px-input"
              placeholder={t('tasks.search.placeholder')}
              value={query}
              onChange={(e) => navigate(searchPath(e.target.value), { replace: true })}
            />
          </form>
        ) : null}
      </Window>

      {source.type !== 'search' && !isCompleted ? <AddTaskBar onAdd={addTask} /> : null}

      {isMyDay ? (
        <Window as="div" className="py-2!">
          <Button aria-expanded={showSuggestions} onClick={() => setShowSuggestions((v) => !v)}>
            {showSuggestions ? '▾' : '▸'} {t('tasks.suggestions')} ({suggestions.length})
          </Button>
          {showSuggestions ? (
            suggestions.length ? (
              <ul className="mt-2 flex flex-col gap-1">
                {suggestions.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-icon-btn"
                      aria-label={t('tasks.suggestions.add', { title: s.title })}
                      onClick={() => useGameStore.getState().toggleMyDay(s.id)}
                    >
                      +
                    </button>
                    <span className="truncate">{s.title}</span>
                    {s.dueDate ? <span className="ml-auto text-win-dim">{formatDay(s.dueDate)}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-win-dim">{t('tasks.suggestions.none')}</p>
            )
          ) : null}
        </Window>
      ) : null}

      <Window as="div">
        {isCompleted ? (
          viewTasks.done.length ? (
            <TaskList
              aria-label={title}
              sections={[{ id: 'done', tasks: viewTasks.done }]}
              today={today}
              showListName
              selectedId={selectedId}
              onOpen={open}
            />
          ) : (
            <p className="text-win-dim">{t('tasks.empty.completed')}</p>
          )
        ) : hasOpen ? (
          <TaskList
            aria-label={title}
            sections={openSections}
            today={today}
            sortable={sortMode === 'manual' && !isPlanned}
            showListName={source.type !== 'list'}
            hideMyDayBadge={isMyDay}
            selectedId={selectedId}
            onOpen={open}
          />
        ) : (
          <p className="text-win-dim">
            {source.type === 'search'
              ? query.trim()
                ? t('tasks.empty.search', { q: query })
                : t('tasks.search.placeholder')
              : t('tasks.empty')}
          </p>
        )}
        {hasOpen && !isCompleted ? <p className="mt-3 hidden text-base text-win-dim md:block">{t('tasks.shortcuts')}</p> : null}
      </Window>

      {!isCompleted && viewTasks.done.length > 0 ? (
        <Window as="div">
          <Button aria-expanded={showDone} onClick={() => setShowDone((v) => !v)}>
            {showDone ? '▾' : '▸'} {t('tasks.completedSection', { n: viewTasks.done.length })}
          </Button>
          {showDone ? (
            <div className="mt-2">
              <TaskList
                aria-label={t('tasks.completedSection', { n: viewTasks.done.length })}
                sections={[{ id: 'done', tasks: viewTasks.done }]}
                today={today}
                showListName={source.type !== 'list'}
                selectedId={selectedId}
                onOpen={open}
              />
            </div>
          ) : null}
        </Window>
      ) : null}
    </div>
  );

  return (
    <div className="flex gap-4">
      {main}
      {selectedTask ? (
        wide ? (
          <aside className="w-[24rem] shrink-0">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <TaskDetail key={selectedTask.id} task={selectedTask} onClose={closeDetail} />
            </div>
          </aside>
        ) : (
          <div
            className="px-overlay items-start! overflow-y-auto"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDetail();
            }}
          >
            <div className="w-full max-w-lg">
              <TaskDetail key={selectedTask.id} task={selectedTask} onClose={closeDetail} />
            </div>
          </div>
        )
      ) : null}
      {editingList && list ? (
        <ListEditDialog
          listId={list.id}
          onClose={() => setEditingList(false)}
          onDeleted={() => navigate(`${QUESTS_BASE}/meu-dia`)}
        />
      ) : null}
    </div>
  );
}

/** Página de listas no mobile (no desktop o painel fica na barra lateral). */
export function ListsPage() {
  const wide = useMediaQuery('(min-width: 768px)');
  if (wide) return <Navigate to={`${QUESTS_BASE}/meu-dia`} replace />;
  return (
    <Window title={t('tasks.lists')}>
      <ListsPanel />
    </Window>
  );
}
