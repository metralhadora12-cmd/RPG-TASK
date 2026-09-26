/** Camada escrita como texto: cada caractere é uma chave de paleta; '.' é transparente. */
export interface LayerSource {
  /** Metade esquerda (até 32 colunas), espelhada para formar 64. */
  half?: readonly string[];
  /** Linhas completas (até 64 colunas; o que falta à direita e embaixo é transparente). */
  rows?: readonly string[];
}

/** Mapa chave → cor (#rrggbb). */
export type SpritePalette = Readonly<Record<string, string>>;

/** Camada pronta para compor: 64 linhas de 64 caracteres + paleta própria. */
export interface PaletteLayer {
  id: string;
  rows: readonly string[];
  palette: SpritePalette;
  /** Camadas "de trás" (cabelo longo, capa) ficam atrás do corpo. */
  behind?: boolean;
  /** Não acompanha silhueta/respiração (ex.: mascote ao lado do herói). */
  fixed?: boolean;
  /**
   * Presa a um braço: na silhueta robusta desliza junto com o ombro em vez de alargar
   * (`near` = braço da frente, à esquerda; `far` = braço de trás, à direita).
   */
  anchor?: 'near' | 'far';
}

/** Grade de cores resultante (null = transparente). */
export type PixelGrid = (string | null)[][];

export const SPRITE_SIZE = 64;

/** Geometria do herói (vista 3/4 voltada para a direita) dentro do canvas. */
export const HERO = {
  /** A silhueta robusta alarga daqui para baixo (1px por lado nas 2 primeiras linhas, 2px depois). */
  widenRow: 27,
  /** Quanto os braços (e a arma) deslizam para fora na silhueta robusta. */
  armShift: 2,
  /** Linha lisa do tronco que "some" no quadro de respiração. */
  waistRow: 36,
  /** Recorte do busto para o HUD (colunas e linhas). */
  bust: { x: [18, 46] as [number, number], y: [3, 31] as [number, number] },
} as const;
