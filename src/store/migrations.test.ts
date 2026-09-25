import { describe, expect, it } from 'vitest';
import { defaultSettings } from './defaults';
import { migrate, STORE_VERSION } from './migrations';

describe('migrate', () => {
  it('leva um save vazio da v0 à versão atual com todos os campos', () => {
    const state = migrate({}, 0);
    expect(state.settings).toEqual(defaultSettings);
    expect(state.character).toBeNull();
    expect(state.tasks).toEqual([]);
    expect(state.lists).toEqual([]);
    expect(state.groups).toEqual([]);
    expect(state.rewardLog).toEqual([]);
  });

  it('preserva configurações existentes', () => {
    const state = migrate({ settings: { volume: 0.1 } }, 0);
    expect(state.settings.volume).toBe(0.1);
    expect(state.settings.theme).toBe(defaultSettings.theme);
  });

  it('não altera um save que já está na versão atual', () => {
    const save = { settings: defaultSettings, tasks: [{ id: 'x' }] };
    expect(migrate(save, STORE_VERSION)).toBe(save);
  });
});
