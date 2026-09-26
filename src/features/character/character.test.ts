import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { classBaseStats } from '@/sprites/characterParts';
import { initialPersistedState, useGameStore } from '@/store/useGameStore';
import { randomAppearance, rollD20 } from './random';
import { allocatedPoints, removeAllocated } from './stats';

const store = () => useGameStore.getState();
const hero = () => store().character;
const appearance = { body: 'a' as const, skin: 1, hairStyle: 2, hairColor: 3, eyes: 4, outfit: 1 };

describe('stats', () => {
  it('conta e remove pontos distribuídos do atributo mais alto', () => {
    const base = { str: 5, int: 5, agi: 5, vit: 5 };
    const stats = { str: 8, int: 6, agi: 5, vit: 5 };
    expect(allocatedPoints(stats, base)).toBe(4);
    expect(removeAllocated(stats, base, 2)).toEqual({ str: 6, int: 6, agi: 5, vit: 5 });
    expect(removeAllocated(stats, base, 10)).toEqual(base);
  });
});

describe('aleatório', () => {
  it('gera aparência válida e d20 entre 1 e 20', () => {
    for (const r of [0, 0.5, 0.999999]) {
      const a = randomAppearance(() => r);
      expect(a.skin).toBeGreaterThanOrEqual(0);
      expect(a.skin).toBeLessThan(8);
      expect(a.hairStyle).toBeLessThan(10);
      expect(a.hairColor).toBeLessThan(12);
      expect(a.outfit).toBeLessThan(3);
    }
    expect(rollD20(() => 0)).toBe(1);
    expect(rollD20(() => 0.999999)).toBe(20);
  });
});

describe('ações do personagem', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
    useGameStore.setState(initialPersistedState());
  });
  afterEach(() => vi.useRealTimers());

  it('cria o herói com nome limpo (até 12) e atributos da classe', () => {
    store().createCharacter({ name: '  Aria   da  Silva Sauro ', classId: 'mage', appearance });
    expect(hero()).toMatchObject({ name: 'Aria da Silv', classId: 'mage', appearance, stats: classBaseStats.mage });
  });

  it('ignora nome vazio', () => {
    store().createCharacter({ name: '   ', classId: 'mage', appearance });
    expect(hero().name).toBe('');
  });

  it('muda aparência sem mexer na classe', () => {
    store().createCharacter({ name: 'Aria', classId: 'rogue', appearance });
    store().updateAppearance({ name: 'Bia', appearance: { ...appearance, hairColor: 9 } });
    expect(hero()).toMatchObject({ name: 'Bia', classId: 'rogue' });
    expect(hero().appearance.hairColor).toBe(9);
  });

  it('distribui pontos só quando há pontos livres', () => {
    useGameStore.setState({ character: { ...hero(), unspentPoints: 1 } });
    expect(store().allocatePoint('vit')).toBe(true);
    expect(store().allocatePoint('vit')).toBe(false);
    expect(hero()).toMatchObject({ unspentPoints: 0, stats: { vit: classBaseStats.warrior.vit + 1 } });
  });

  it('reencarnação exige nível 10, troca a classe e devolve os pontos', () => {
    expect(store().reincarnate('cleric')).toBe(false);
    useGameStore.setState({ character: { ...hero(), level: 10, stats: { str: 20, int: 3, agi: 5, vit: 12 } } });
    expect(store().reincarnate('warrior')).toBe(false); // mesma classe
    expect(store().reincarnate('cleric')).toBe(true);
    expect(hero()).toMatchObject({ classId: 'cleric', level: 10, stats: classBaseStats.cleric, unspentPoints: 18 });
  });

  it('desfazer um level up cujos pontos já foram gastos tira do atributo', () => {
    useGameStore.setState({ character: { ...hero(), xp: 70 } });
    const id = store().addTask({ title: 'x', difficulty: 'epic' });
    store().completeTask(id, { random: () => 0.5 });
    store().allocatePoint('str');
    store().allocatePoint('str');
    expect(hero()).toMatchObject({ level: 2, unspentPoints: 0 });
    store().uncompleteTask(id);
    expect(hero()).toMatchObject({ level: 1, unspentPoints: 0, stats: classBaseStats.warrior });
  });
});
