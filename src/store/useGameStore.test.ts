import { beforeEach, describe, expect, it } from 'vitest';
import { get, set } from 'idb-keyval';
import { initialPersistedState, STORE_KEY, useGameStore } from './useGameStore';
import { STORE_VERSION } from './migrations';

async function flush() {
  // O persist grava de forma assíncrona no IndexedDB.
  await new Promise((r) => setTimeout(r, 20));
}

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.setState(initialPersistedState());
  });

  it('atualiza configurações parcialmente', () => {
    useGameStore.getState().updateSettings({ volume: 0.2 });
    const { settings } = useGameStore.getState();
    expect(settings.volume).toBe(0.2);
    expect(settings.soundEnabled).toBe(true);
  });

  it('persiste o estado no IndexedDB com versão', async () => {
    useGameStore.getState().updateSettings({ theme: 'lava' });
    await flush();
    const raw = await get<string>(STORE_KEY);
    expect(raw).toBeTruthy();
    const saved = JSON.parse(raw!);
    expect(saved.version).toBe(STORE_VERSION);
    expect(saved.state.settings.theme).toBe('lava');
    expect(saved.state).not.toHaveProperty('hydrated');
  });

  it('reidrata e migra um save antigo do IndexedDB', async () => {
    await set(STORE_KEY, JSON.stringify({ version: 0, state: { settings: { dayStartHour: 5 } } }));
    await useGameStore.persist.rehydrate();
    const s = useGameStore.getState();
    expect(s.hydrated).toBe(true);
    expect(s.settings.dayStartHour).toBe(5);
    expect(s.settings.theme).toBe('classic');
    expect(s.tasks).toEqual([]);
  });

  it('resetProgress mantém as configurações', () => {
    useGameStore.getState().updateSettings({ readableFont: true });
    useGameStore.setState({ tasks: [{ id: 't' } as never] });
    useGameStore.getState().resetProgress();
    const s = useGameStore.getState();
    expect(s.tasks).toEqual([]);
    expect(s.settings.readableFont).toBe(true);
  });
});
