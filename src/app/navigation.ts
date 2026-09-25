import type { MessageKey } from '@/lib/i18n';
import type { NavIconId } from './navIcons';

export interface NavEntry {
  to: string;
  label: MessageKey;
  icon: NavIconId;
}

export const mainNav: NavEntry[] = [
  { to: '/missoes', label: 'nav.quests', icon: 'quests' },
  { to: '/personagem', label: 'nav.character', icon: 'character' },
  { to: '/loja', label: 'nav.shop', icon: 'shop' },
  { to: '/menu', label: 'nav.menu', icon: 'menu' },
];
