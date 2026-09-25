/** Camada escrita como texto: cada caractere é uma chave de paleta; '.' é transparente. */
export interface LayerSource {
  /** Metade esquerda (16 colunas), espelhada para formar 32. */
  half?: readonly string[];
  /** Linhas completas (32 colunas). */
  rows?: readonly string[];
}

/** Mapa chave → cor (#rrggbb). */
export type SpritePalette = Readonly<Record<string, string>>;

/** Camada pronta para compor: 32 linhas de 32 caracteres + paleta própria. */
export interface PaletteLayer {
  id: string;
  rows: readonly string[];
  palette: SpritePalette;
  /** Camadas "de trás" (cabelo longo, capa) ficam atrás do corpo. */
  behind?: boolean;
  /** Não acompanha silhueta/respiração (ex.: mascote ao lado do herói). */
  fixed?: boolean;
}

/** Grade de cores resultante (null = transparente). */
export type PixelGrid = (string | null)[][];

export const SPRITE_SIZE = 32;
