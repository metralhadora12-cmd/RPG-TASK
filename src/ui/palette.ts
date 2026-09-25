/**
 * Paleta limitada do QuestLog. Toda cor usada na UI deve vir daqui
 * (diretamente ou através das variáveis CSS geradas por `themeToCssVars`).
 */
export const palette = {
  ink: '#08081c',
  night: '#10186b',
  royal: '#3a4fb8',
  sky: '#6c8cf0',
  frost: '#c8d0f8',
  white: '#f8f8f8',
  paper: '#e8e8f8',
  gray: '#9098b8',
  slate: '#4a5078',

  hpGreen: '#38d038',
  hpYellow: '#f8d030',
  hpRed: '#e83838',
  mpBlue: '#38a8f8',
  xpGold: '#f8b800',
  xpGoldLight: '#f8e070',
  gold: '#f8c838',

  rarityCommon: '#c8c8d8',
  rarityUncommon: '#48d048',
  rarityRare: '#4890f8',
  rarityEpic: '#b058f0',
  rarityLegendary: '#f89820',
} as const;

export type PaletteColor = keyof typeof palette;

export type ThemeId = 'classic' | 'parchment' | 'forest' | 'lava' | 'starry';

export interface WindowTheme {
  id: ThemeId;
  /** Topo do gradiente vertical da janela. */
  winTop: string;
  /** Base do gradiente vertical da janela. */
  winBottom: string;
  /** Contorno externo (sombra do chanfro). */
  borderOuter: string;
  /** Faixa clara do chanfro. */
  borderLight: string;
  /** Faixa intermediária do chanfro. */
  borderMid: string;
  text: string;
  textDim: string;
  /** Sombra de 2px do texto (escura em temas escuros, clara em temas claros). */
  textShadow: string;
  /** Cor de destaque (seleção, títulos). */
  accent: string;
  /** Fundo da página por trás das janelas. */
  backdrop: string;
}

export const themes: Record<ThemeId, WindowTheme> = {
  classic: {
    id: 'classic',
    winTop: palette.royal,
    winBottom: palette.night,
    borderOuter: palette.ink,
    borderLight: palette.white,
    borderMid: palette.gray,
    text: palette.white,
    textDim: palette.frost,
    textShadow: palette.ink,
    accent: palette.xpGoldLight,
    backdrop: '#050514',
  },
  parchment: {
    id: 'parchment',
    winTop: '#f0dca8',
    winBottom: '#d4b078',
    borderOuter: '#3a2410',
    borderLight: '#fff4d8',
    borderMid: '#8a6030',
    text: '#2a1808',
    textDim: '#4a2c10',
    textShadow: '#fff4d8',
    accent: '#6a1404',
    backdrop: '#1c1008',
  },
  forest: {
    id: 'forest',
    winTop: '#237038',
    winBottom: '#0c3418',
    borderOuter: '#041008',
    borderLight: '#d8f8c8',
    borderMid: '#6aa060',
    text: palette.white,
    textDim: '#c8f0c0',
    textShadow: '#041008',
    accent: '#f8e070',
    backdrop: '#030a05',
  },
  lava: {
    id: 'lava',
    winTop: '#98301a',
    winBottom: '#400808',
    borderOuter: '#140202',
    borderLight: '#f8d8a8',
    borderMid: '#c07040',
    text: palette.white,
    textDim: '#f8d0b8',
    textShadow: '#140202',
    accent: '#f8e070',
    backdrop: '#0a0202',
  },
  starry: {
    id: 'starry',
    winTop: '#281850',
    winBottom: '#05030f',
    borderOuter: '#000000',
    borderLight: '#e0d8ff',
    borderMid: '#6858a8',
    text: palette.white,
    textDim: '#c8c0f0',
    textShadow: '#000000',
    accent: '#a8e8ff',
    backdrop: '#000000',
  },
};

export const themeIds = Object.keys(themes) as ThemeId[];

/** Converte um tema em variáveis CSS aplicáveis ao elemento raiz. */
export function themeToCssVars(theme: WindowTheme): Record<string, string> {
  return {
    '--win-top': theme.winTop,
    '--win-bottom': theme.winBottom,
    '--win-border-outer': theme.borderOuter,
    '--win-border-light': theme.borderLight,
    '--win-border-mid': theme.borderMid,
    '--win-text': theme.text,
    '--win-text-dim': theme.textDim,
    '--win-text-shadow': theme.textShadow,
    '--win-accent': theme.accent,
    '--backdrop': theme.backdrop,
  };
}

/** Cor da barra de HP conforme a fração restante (verde → amarelo → vermelho). */
export function hpColor(ratio: number): string {
  if (ratio > 0.5) return palette.hpGreen;
  if (ratio > 0.25) return palette.hpYellow;
  return palette.hpRed;
}
