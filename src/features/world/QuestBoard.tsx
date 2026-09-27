import { Html } from '@react-three/drei';
import { useMemo, useState, type FormEvent } from 'react';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import { isInMyDay } from '@/features/tasks/selectors';
import { useTaskCommands } from '@/features/tasks/useTaskCommands';
import { useToday } from '@/features/tasks/useToday';
import { worldPalette as W } from '@/ui/palette';

const VISIBLE = 5;

/**
 * Pergaminhos do "Meu Dia" pregados no quadro. É HTML de verdade projetado na cena
 * (botões e campo acessíveis por teclado e leitor de tela).
 */
export function QuestBoard() {
  const tasks = useGameStore((s) => s.tasks);
  const addTask = useGameStore((s) => s.addTask);
  const today = useToday();
  const commands = useTaskCommands();
  const [title, setTitle] = useState('');
  const open = useMemo(
    () => tasks.filter((x) => !x.completedAt && x.kind !== 'habit' && isInMyDay(x, today)).sort((a, b) => a.order - b.order),
    [tasks, today],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    addTask({ title: clean, myDay: true });
    setTitle('');
  };

  return (
    <Html transform position={[0, 1.47, 0.04]} scale={0.32} zIndexRange={[20, 0]}>
      <div
        className="flex w-[200px] flex-col gap-1 font-body text-[11px] leading-tight"
        style={{ color: W.outline }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-0.5 text-center font-title text-[7px]" style={{ color: W.paper, textShadow: `1px 1px 0 ${W.outline}` }}>
          {t('world.board')}
        </h2>
        {open.length === 0 && (
          <p className="rounded-sm px-1.5 py-1" style={{ background: W.paper }}>
            {t('world.boardEmpty')}
          </p>
        )}
        <ul className="flex flex-col gap-1">
          {open.slice(0, VISIBLE).map((task, i) => (
            <li key={task.id} style={{ transform: `rotate(${i % 2 ? 1.2 : -1}deg)` }}>
              <button
                type="button"
                aria-label={t('world.complete', { title: task.title })}
                onClick={(e) => commands.toggleComplete(task.id, e.currentTarget)}
                className="flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left shadow-[1px_1px_0_rgba(0,0,0,0.35)] hover:brightness-110 focus-visible:outline-2"
                style={{ background: W.paper }}
              >
                <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-[1px] border" style={{ borderColor: W.woodDark }} />
                <span className="truncate">{task.title}</span>
              </button>
            </li>
          ))}
        </ul>
        {open.length > VISIBLE && (
          <p className="text-right text-[9px]" style={{ color: W.paper }}>
            {t('world.boardMore', { n: open.length - VISIBLE })}
          </p>
        )}
        <form onSubmit={submit} className="mt-0.5 flex gap-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('world.addPlaceholder')}
            aria-label={t('world.addPlaceholder')}
            className="min-w-0 flex-1 rounded-sm px-1 py-0.5 text-[10px]"
            style={{ background: W.paper, color: W.outline }}
          />
          <button type="submit" className="rounded-sm px-1.5 font-title text-[6px]" style={{ background: W.roofRed, color: W.paper }}>
            {t('world.add')}
          </button>
        </form>
      </div>
    </Html>
  );
}
