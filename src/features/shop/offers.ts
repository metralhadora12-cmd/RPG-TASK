import { mulberry32 } from './backgrounds';
import { catalog, getItem, type ShopItem } from './catalog';

export const OFFER_COUNT = 4;
export const OFFER_DISCOUNT = 0.2;

/** Hash estável (FNV-1a) de um texto, para semear as ofertas pela data. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 4 itens em oferta no dia (yyyy-MM-dd); iguais para o dia inteiro. Consumíveis não entram. */
export function dailyOffers(day: string): string[] {
  const pool = catalog.filter((i) => i.category !== 'consumable').map((i) => i.id);
  const rand = mulberry32(hashString(day));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, OFFER_COUNT);
}

/** Preço no dia, com 20% de desconto para itens em oferta. */
export function priceFor(item: ShopItem, day: string): number {
  return dailyOffers(day).includes(item.id) ? Math.round(item.price * (1 - OFFER_DISCOUNT)) : item.price;
}

export function priceForId(id: string, day: string): number | undefined {
  const item = getItem(id);
  return item ? priceFor(item, day) : undefined;
}
