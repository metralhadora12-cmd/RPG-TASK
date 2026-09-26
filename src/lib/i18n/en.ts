import type { MessageKey } from './pt-BR';

/** Tradução parcial para inglês; chaves ausentes caem no pt-BR. */
export const en: Partial<Record<MessageKey, string>> = {
  'app.tagline': 'Your tasks become quests.',
  'nav.quests': 'Quests',
  'nav.character': 'Character',
  'nav.shop': 'Shop',
  'nav.menu': 'Menu',
  'common.yes': 'Yes',
  'common.no': 'No',
  'settings.title': 'Settings',
  'boss.title': 'Weekly boss',
};
