import type { ThemeId } from '@/ui/palette';
import type { Locale } from '@/lib/i18n';

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'epic';
export type TaskKind = 'todo' | 'daily' | 'habit';
export type HabitDirection = 'both' | 'up' | 'down';
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
  /** Vencimento (yyyy-MM-dd). */
  dueDate?: string;
  /** Data/hora local (yyyy-MM-ddTHH:mm) do lembrete. */
  reminderAt?: string;
  /** Quando o lembrete atual já foi disparado (evita repetir após recarregar). */
  reminderFiredAt?: string;
  recurrence?: Recurrence;
  subtasks: Subtask[];
  tags: string[];
  completedAt?: string;
  streak: number;
  habitCounts?: { up: number; down: number; date: string };
  /** Hábitos: quais botões aparecem (+, − ou ambos). */
  habitDirection?: HabitDirection;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type SortMode = 'manual' | 'dueDate' | 'importance' | 'difficulty' | 'alpha';

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
  kind: 'complete' | 'habitUp' | 'habitDown' | 'dailyMissed' | 'purchase' | 'faint' | 'potion';
  /** Variações efetivamente aplicadas (negativas para perdas). */
  xp: number;
  gold: number;
  hp: number;
  at: string;
  critical?: boolean;
  levelsGained?: number;
  hpHealed?: number;
  mpHealed?: number;
  pointsGained?: number;
  /** Próxima ocorrência criada ao concluir uma tarefa recorrente. */
  spawnedTaskId?: string;
  /** Sequência da rotina antes da conclusão (para desfazer). */
  streakBefore?: number;
  /** Evento irreversível (ex.: desmaio no meio). */
  final?: boolean;
  /** Item comprado (compras). */
  itemId?: string;
  /** Preenchido quando o evento foi desfeito. */
  revertedAt?: string;
}

/** Resultado do fechamento de um dia ("Relatório da noite"). */
export interface NightReport {
  /** Último dia fechado (yyyy-MM-dd). */
  day: string;
  missed: { title: string; difficulty: Difficulty; damage: number }[];
  completed: string[];
  streaksLost: { title: string; streak: number }[];
  hpLost: number;
  penaltiesEnabled: boolean;
  faint: FaintInfo | null;
}

/** Dados da tela de "Game Over". */
export interface FaintInfo {
  xpLost: number;
  goldLost: number;
  level: number;
}

/** Contadores vitalícios para a tela de status. */
export interface LifetimeStats {
  tasksCompleted: number;
  xpEarned: number;
  goldEarned: number;
  criticals: number;
  bestStreak: number;
  goldSpent: number;
  itemsBought: number;
  faints: number;
  habitUps: number;
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
