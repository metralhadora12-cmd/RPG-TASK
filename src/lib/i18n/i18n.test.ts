import { afterEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '.';

describe('i18n', () => {
  afterEach(() => setLocale('pt-BR'));

  it('traduz em pt-BR por padrão', () => {
    expect(t('nav.quests')).toBe('Missões');
  });

  it('interpola variáveis', () => {
    expect(t('hud.goldLabel', { amount: 120 })).toBe('120 de ouro');
  });

  it('mantém placeholders sem valor', () => {
    expect(t('hud.goldLabel', {})).toBe('{amount} de ouro');
  });

  it('usa o idioma ativo e cai no pt-BR quando falta tradução', () => {
    setLocale('en');
    expect(t('nav.quests')).toBe('Quests');
    expect(t('page.quests.title')).toBe('Missões');
  });
});
