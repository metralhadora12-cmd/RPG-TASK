import type { ThemeId } from '@/ui/palette';
import type { Locale } from '@/lib/i18n';

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'epic';
export type TaskKind = 'todo' | 'daily' | 'habit';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Recurrence =
  | { type: 'daily' }
  | { type: 'weekdays' }
  | { type: 'weekly'; days: Weekday[] }
  | { type: 'monthly' }
  | { type: 'yearly' }
  | { type: 'everyNDays'; interval: number };

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  listId: string;
  kind: TaskKind;
  title: string;
  notes?: string;
  difficulty: Difficulty;
  important: boolean;
  /** Dia (yyyy-MM-dd) em que a tarefa foi adicionada ao "Meu Dia". */
  myDayDate?: string;
  dueDate?: string;
  reminderAt?: string;
  recurrence?: Recurrence;
  subtasks: Subtask[];
  tags: string[];
  completedAt?: string;
  streak: number;
  habitCounts?: { up: number; down: number; date: string };
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskList {
  id: string;
  name: string;
  icon: string;
  color: string;
  groupId?: string;
  order: number;
  createdAt: string;
}

export interface ListGroup {
  id: string;
  name: string;
  order: number;
  collapsed: boolean;
}

export type ClassId = 'warrior' | 'mage' | 'rogue' | 'cleric';
export type BodyType = 'a' | 'b';
export type Slot = 'hat' | 'armor' | 'weapon' | 'accessory' | 'pet' | 'background' | 'theme';

export interface Appearance {
  body: BodyType;
  skin: number;
  hairStyle: number;
  hairColor: number;
  eyes: number;
  outfit: number;
}

export interface Stats {
  str: number;
  int: number;
  agi: number;
  vit: number;
}

export interface Character {
  name: string;
  classId: ClassId;
  appearance: Appearance;
  level: number;
  xp: number;
  hp: number;
  mp: number;
  gold: number;
  stats: Stats;
  unspentPoints: number;
  equipped: Partial<Record<Slot, string>>;
  inventory: { itemId: string; qty: number }[];
  achievements: string[];
  /** Último dia de jogo (yyyy-MM-dd) cujas diárias já foram processadas. */
  lastDayProcessed: string;
}

/** Evento de recompensa — base para desfazer e para estatísticas. */
export interface RewardEvent {
  id: string;
  taskId?: string;
  kind: 'complete' | 'undo' | 'habitUp' | 'habitDown' | 'dailyMissed' | 'purchase' | 'faint' | 'potion';
  xp: number;
  gold: number;
  hp: number;
  at: string;
  /** Id do evento revertido (para `undo`). */
  reverts?: string;
}

export type ReducedMotionPref = 'system' | 'on' | 'off';

export interface Settings {
  locale: Locale;
  soundEnabled: boolean;
  /** 0..1 */
  volume: number;
  penaltiesEnabled: boolean;
  readableFont: boolean;
  reducedMotion: ReducedMotionPref;
  weekStartsOn: 0 | 1;
  /** Hora (0–23) em que o dia de jogo vira. */
  dayStartHour: number;
  theme: ThemeId;
}
