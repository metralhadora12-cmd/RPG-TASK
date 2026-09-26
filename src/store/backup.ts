import { migrate, STORE_VERSION } from './migrations';
import type { PersistedState } from './useGameStore';

export const BACKUP_APP = 'questlog';

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  state: PersistedState;
}

export function createBackup(state: PersistedState, now = new Date()): BackupFile {
  return { app: BACKUP_APP, version: STORE_VERSION, exportedAt: now.toISOString(), state };
}

export type ParseResult = { ok: true; state: PersistedState } | { ok: false; reason: 'invalid' | 'newer' };

/** Lê um backup JSON, valida o formato e migra saves antigos para a versão atual. */
export function parseBackup(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  const file = data as Partial<BackupFile> | null;
  if (!file || file.app !== BACKUP_APP || typeof file.version !== 'number' || typeof file.state !== 'object' || !file.state) {
    return { ok: false, reason: 'invalid' };
  }
  if (file.version > STORE_VERSION) return { ok: false, reason: 'newer' };
  const state = migrate(file.state, file.version);
  if (!state.character || !Array.isArray(state.tasks) || !Array.isArray(state.lists)) return { ok: false, reason: 'invalid' };
  return { ok: true, state };
}

/** Só as partes persistidas do estado (o que vai no backup). */
export function persistedPart(s: PersistedState): PersistedState {
  return {
    settings: s.settings,
    character: s.character,
    lists: s.lists,
    groups: s.groups,
    tasks: s.tasks,
    rewardLog: s.rewardLog,
    lifetime: s.lifetime,
    pendingReport: s.pendingReport,
    pendingFaint: s.pendingFaint,
    onboardingDone: s.onboardingDone,
    viewPrefs: s.viewPrefs,
    boss: s.boss,
  };
}
