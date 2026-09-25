import { describe, expect, it } from 'vitest';
import { defaultSettings } from './defaults';
import { migrate, STORE_VERSION } from './migrations';

describe('migrate', () => {
  it('leva um save vazio da v0 à versão atual com todos os campos', () => {
    const state = migrate({}, 0);
    expect(state.settings).toEqual(defaultSettings);
    expect(state.character).toBeNull();
    expect(state.tasks).toEqual([]);
    expect(state.lists.map((l) => l.id)).toEqual(['inbox']);
    expect(state.viewPrefs).toEqual({});
    expect(state.groups).toEqual([]);
    expect(state.rewardLog).toEqual([]);
  });

  it('preserva configurações existentes', () => {
    const state = migrate({ settings: { volume: 0.1 } }, 0);
    expect(state.settings.volume).toBe(0.1);
    expect(state.settings.theme).toBe(defaultSettings.theme);
  });

  it('v1 → v2 adiciona a lista padrão sem duplicar e preserva listas existentes', () => {
    const custom = { id: 'x', name: 'Trabalho', icon: 'sword', color: '#fff', order: 1, createdAt: '' };
    const state = migrate({ settings: defaultSettings, lists: [custom], tasks: [], rewardLog: [] }, 1);
    expect(state.lists.map((l) => l.id)).toEqual(['inbox', 'x']);
    expect(state.lists[0]!.name).toBe('Tarefas');
    const again = migrate({ ...state }, 1);
    expect(again.lists.filter((l) => l.id === 'inbox')).toHaveLength(1);
  });

  it('não altera um save que já está na versão atual', () => {
    const save = { settings: defaultSettings, tasks: [{ id: 'x' }] };
    expect(migrate(save, STORE_VERSION)).toBe(save);
  });
});
