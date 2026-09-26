import type { ReactNode } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { BG_HEIGHT } from './backgrounds';
import { BackgroundCanvas } from './BackgroundCanvas';
import { backgroundFor, type Equipped } from './equipment';

export interface HeroStageProps {
  /** Equipamento a mostrar (padrão: o atual). Define o fundo. */
  equipped?: Equipped;
  /** Tamanho do "pixel" do cenário. */
  scale?: number;
  width?: number;
  children: ReactNode;
}

/** Palco com o cenário equipado atrás do sprite (ou o palco liso sem cenário). */
export function HeroStage({ equipped, scale = 5, width = 300, children }: HeroStageProps) {
  const current = useGameStore((s) => s.character.equipped);
  const bg = backgroundFor(equipped ?? current);
  if (!bg) return <div className="stage flex justify-center">{children}</div>;
  return (
    <div className="stage relative flex justify-center overflow-hidden p-0!" style={{ height: BG_HEIGHT * scale }}>
      <BackgroundCanvas id={bg} width={width} scale={scale} className="absolute inset-0 m-auto" />
      <div className="relative self-end" style={{ marginBottom: -Math.round(scale * 0.6) }}>
        {children}
      </div>
    </div>
  );
}
