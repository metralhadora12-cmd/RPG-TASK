import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import type { Task } from '@/store/types';
import { computeReward, goldRange, rewardModifiers } from './formulas';

const pct = (n: number) => Math.round(n * 100);

/** Prévia da recompensa de uma tarefa com os bônus que estão valendo. */
export function RewardPreview({ task, today }: { task: Task; today: string }) {
  const classId = useGameStore((s) => s.character.classId);
  const input = {
    difficulty: task.difficulty,
    subtasksDone: task.subtasks.filter((s) => s.done).length,
    onTime: Boolean(task.dueDate && today <= task.dueDate),
    streak: task.kind === 'daily' ? task.streak : 0,
    classId,
  };
  const { xp } = computeReward({ ...input, random: () => 0.5 });
  const [goldMin, goldMax] = goldRange(input);
  const mods = rewardModifiers(input);
  const bonuses = [
    mods.subtasks > 0 && t('progress.preview.subtasks', { n: pct(mods.subtasks) }),
    mods.punctuality > 0 && t('progress.preview.punctuality', { n: pct(mods.punctuality) }),
    mods.streak > 0 && t('progress.preview.streak', { n: pct(mods.streak) }),
    mods.classXp > 0 && t('progress.preview.classXp', { n: pct(mods.classXp) }),
    mods.classGold > 0 && t('progress.preview.classGold', { n: pct(mods.classGold) }),
  ].filter(Boolean) as string[];

  return (
    <div className="px-chip flex-col items-start! gap-0! py-1">
      <p>
        <span className="font-title text-[0.55rem] text-win-accent">{t('progress.preview')}: </span>
        <span className="tabular-nums">
          {goldMin === goldMax
            ? t('progress.preview.valueExact', { xp, gold: goldMin })
            : t('progress.preview.value', { xp, goldMin, goldMax })}
        </span>
      </p>
      {bonuses.length > 0 ? <p className="text-win-dim">{bonuses.join(' · ')}</p> : null}
      <p className="text-base text-win-dim">{t('progress.preview.luck')}</p>
    </div>
  );
}
