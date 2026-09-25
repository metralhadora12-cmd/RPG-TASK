import { useEffect } from 'react';
import { setLocale } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import { themes, themeToCssVars } from '@/ui/palette';
import { useReducedMotion } from '@/ui/useReducedMotion';

/** Aplica tema, fonte legível, redução de movimento e idioma no documento. */
export function SettingsEffects() {
  const settings = useGameStore((s) => s.settings);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    const theme = themes[settings.theme] ?? themes.classic;
    for (const [name, value] of Object.entries(themeToCssVars(theme))) {
      root.style.setProperty(name, value);
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.winBottom);
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('font-readable', settings.readableFont);
  }, [settings.readableFont]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduced);
  }, [reduced]);

  useEffect(() => {
    setLocale(settings.locale);
    document.documentElement.lang = settings.locale;
  }, [settings.locale]);

  return null;
}
