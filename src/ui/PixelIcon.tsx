import type { CSSProperties, ReactElement } from 'react';

/**
 * Desenha uma matriz de caracteres como pixel art em SVG.
 * Cada caractere é mapeado para uma cor em `colors`; '.' é transparente.
 */
export interface PixelIconProps {
  matrix: readonly string[];
  colors: Readonly<Record<string, string>>;
  /** Tamanho de cada pixel em px (use inteiros para manter a nitidez). */
  scale?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function PixelIcon({ matrix, colors, scale = 2, className, style, title }: PixelIconProps) {
  const height = matrix.length;
  const width = Math.max(...matrix.map((row) => row.length));
  const rects: ReactElement[] = [];
  matrix.forEach((row, y) => {
    // Agrupa pixels iguais consecutivos para gerar menos retângulos.
    let x = 0;
    while (x < row.length) {
      const ch = row[x]!;
      let run = 1;
      while (row[x + run] === ch) run++;
      const fill = colors[ch];
      if (ch !== '.' && fill) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={fill} />);
      }
      x += run;
    }
  });
  return (
    <svg
      className={['pixel', className].filter(Boolean).join(' ')}
      style={style}
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {rects}
    </svg>
  );
}
