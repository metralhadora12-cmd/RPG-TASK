import { beforeEach, describe, expect, it } from 'vitest';
import { heroState } from '@/test/state';
import { createBackup, parseBackup, persistedPart } from './backup';
import { STORE_VERSION } from './migrations';
import { useGameStore } from './useGameStore';

describe('backup', () => {
  beforeEach(() => useGameStore.setState(heroState()));

  it('exporta e importa sem perder dados', () => {
    useGameStore.getState().addTask({ title: 'Salvar o reino' });
    const file = createBackup(persistedPart(useGameStore.getState()));
    expect(file).toMatchObject({ app: 'questlog', version: STORE_VERSION });
    expect(file.state).not.toHaveProperty('hydrated');
    const parsed = parseBackup(JSON.stringify(file));
    expect(parsed.ok).toBe(true);
    useGameStore.getState().resetProgress();
    if (parsed.ok) useGameStore.getState().importSave(parsed.state);
    expect(useGameStore.getState().tasks.map((t) => t.title)).toEqual(['Salvar o reino']);
    expect(useGameStore.getState().character.name).toBe('Aria');
  });

  it('migra backups antigos', () => {
    const old = { app: 'questlog', version: 2, exportedAt: '', state: { tasks: [], lists: [], character: null } };
    const parsed = parseBackup(JSON.stringify(old));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.state.character.level).toBe(1);
  });

  it('recusa arquivos inválidos ou de versão mais nova', () => {
    expect(parseBackup('não é json')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseBackup(JSON.stringify({ app: 'outro', version: 1, state: {} }))).toEqual({ ok: false, reason: 'invalid' });
    expect(parseBackup(JSON.stringify({ app: 'questlog', version: STORE_VERSION + 1, state: {} }))).toEqual({
      ok: false,
      reason: 'newer',
    });
  });
});
