import { smartViews } from './constants';
import type { ViewRef } from './selectors';

export const QUESTS_BASE = '/missoes';

export function viewFromSlug(slug: string | undefined): ViewRef | null {
  const smart = smartViews.find((v) => v.slug === slug);
  return smart ? { type: 'smart', id: smart.id } : null;
}

export function viewPath(view: ViewRef): string {
  if (view.type === 'list') return `${QUESTS_BASE}/lista/${view.id}`;
  return `${QUESTS_BASE}/${smartViews.find((v) => v.id === view.id)!.slug}`;
}

/** Chave usada para guardar preferências (ordenação) por visão. */
export function viewKey(view: ViewRef | { type: 'search' }): string {
  if (view.type === 'search') return 'search';
  return view.type === 'list' ? `list:${view.id}` : view.id;
}

export const searchPath = (query: string) =>
  `${QUESTS_BASE}/busca${query ? `?q=${encodeURIComponent(query)}` : ''}`;
