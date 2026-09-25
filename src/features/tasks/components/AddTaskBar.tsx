import { useId, useState } from 'react';
import { t } from '@/lib/i18n';
import type { Difficulty } from '@/store/types';
import { Button } from '@/ui/Button';
import { Window } from '@/ui/Window';
import { difficulties } from '../constants';

export interface AddTaskBarProps {
  onAdd: (title: string, difficulty: Difficulty) => void;
  placeholder?: string;
}

/** Campo "Adicionar uma missão" com seletor de dificuldade. */
export function AddTaskBar({ onAdd, placeholder = t('tasks.add.placeholder') }: AddTaskBarProps) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const ids = { title: useId(), difficulty: useId() };

  return (
    <Window as="div" className="py-2!">
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onAdd(title, difficulty);
          setTitle('');
        }}
      >
        <label htmlFor={ids.title} className="sr-only">
          {t('tasks.add.label')}
        </label>
        <input
          id={ids.title}
          data-add-task
          className="px-input min-w-[10rem] flex-1"
          placeholder={`+ ${placeholder}`}
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label htmlFor={ids.difficulty} className="sr-only">
          {t('tasks.difficulty')}
        </label>
        <select
          id={ids.difficulty}
          className="px-input w-auto!"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        >
          {difficulties.map((d) => (
            <option key={d} value={d}>
              {t(`tasks.difficulty.${d}`)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="solid" disabled={!title.trim()}>
          {t('tasks.add.submit')}
        </Button>
      </form>
    </Window>
  );
}
