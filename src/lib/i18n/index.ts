import { ptBR, type MessageKey } from './pt-BR';
import { en } from './en';

export type Locale = 'pt-BR' | 'en';
export type { MessageKey };

const dictionaries: Record<Locale, Partial<Record<MessageKey, string>>> = {
  'pt-BR': ptBR,
  en,
};

let currentLocale: Locale = 'pt-BR';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Traduz uma chave, interpolando `{variavel}` com os valores fornecidos.
 * Cai no pt-BR quando a tradução do idioma atual não existe.
 */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const template = dictionaries[currentLocale][key] ?? ptBR[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
