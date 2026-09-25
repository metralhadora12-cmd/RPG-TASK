import type { MessageKey } from '@/lib/i18n';
import type { Difficulty, SortMode } from '@/store/types';
import { palette } from '@/ui/palette';

export const INBOX_LIST_ID = 'inbox';

export const difficulties: Difficulty[] = ['trivial', 'easy', 'medium', 'hard', 'epic'];

export const difficultyRank: Record<Difficulty, number> = {
  trivial: 0,
  easy: 1,
  medium: 2,
  hard: 3,
  epic: 4,
};

export const difficultyColor: Record<Difficulty, string> = {
  trivial: palette.rarityCommon,
  easy: palette.rarityUncommon,
  medium: palette.rarityRare,
  hard: palette.rarityEpic,
  epic: palette.rarityLegendary,
};

export const sortModes: SortMode[] = ['manual', 'dueDate', 'importance', 'difficulty', 'alpha'];

/** Listas inteligentes (fixas) e o trecho de URL de cada uma. */
export type SmartViewId = 'my-day' | 'important' | 'planned' | 'all' | 'completed';

export const smartViews: { id: SmartViewId; slug: string; label: MessageKey; icon: string }[] = [
  { id: 'my-day', slug: 'meu-dia', label: 'tasks.view.myDay', icon: 'sun' },
  { id: 'important', slug: 'importante', label: 'tasks.view.important', icon: 'star' },
  { id: 'planned', slug: 'planejado', label: 'tasks.view.planned', icon: 'calendar' },
  { id: 'all', slug: 'todas', label: 'tasks.view.all', icon: 'scroll' },
  { id: 'completed', slug: 'concluidas', label: 'tasks.view.completed', icon: 'check' },
];

export const listColors: string[] = [
  palette.sky,
  palette.hpGreen,
  palette.hpYellow,
  palette.hpRed,
  palette.rarityEpic,
  palette.rarityLegendary,
  palette.frost,
  palette.gold,
];
