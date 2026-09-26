import { t } from '@/lib/i18n';
import type { Difficulty } from '@/store/types';
import { palette } from '@/ui/palette';
import { difficulties, difficultyColor, difficultyRank } from '../constants';

/** 5 "pips" pixelados indicando a dificuldade. */
export function DifficultyPips({ difficulty }: { difficulty: Difficulty }) {
  const filled = difficultyRank[difficulty] + 1;
  const label = `${t('tasks.difficulty')}: ${t(`tasks.difficulty.${difficulty}`)}`;
  return (
    <span className="flex shrink-0 gap-[2px]" role="img" aria-label={label} title={label}>
      {difficulties.map((d, i) => (
        <span
          key={d}
          className="inline-block size-[6px]"
          style={{
            background: i < filled ? difficultyColor[difficulty] : 'transparent',
            boxShadow: `0 0 0 1px ${palette.ink}`,
          }}
        />
      ))}
    </span>
  );
}
