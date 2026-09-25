import { hpColor, palette } from './palette';

export type BarKind = 'hp' | 'mp' | 'xp';

export interface BarProps {
  kind: BarKind;
  value: number;
  max: number;
  /** Rótulo acessível e visível (ex.: "HP"). */
  label: string;
  showNumbers?: boolean;
  className?: string;
}

function fillColor(kind: BarKind, ratio: number): string {
  if (kind === 'hp') return hpColor(ratio);
  if (kind === 'mp') return palette.mpBlue;
  return palette.xpGold;
}

/** Barra de HP/MP/XP com preenchimento animado em degraus. */
export function Bar({ kind, value, max, label, showNumbers = true, className }: BarProps) {
  const safeMax = Math.max(1, max);
  const clamped = Math.min(Math.max(0, value), safeMax);
  const ratio = clamped / safeMax;
  return (
    <div className={['flex items-center gap-2', className].filter(Boolean).join(' ')}>
      <span className="font-title w-7 shrink-0 text-[0.55rem] text-win-accent text-shadow-pixel" aria-hidden>
        {label}
      </span>
      <div
        className="px-bar flex-1"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round(clamped)}
        aria-valuetext={`${Math.round(clamped)} / ${safeMax}`}
        data-kind={kind}
      >
        <div
          className="px-bar-fill"
          style={{ width: `${ratio * 100}%`, backgroundColor: fillColor(kind, ratio) }}
        />
      </div>
      {showNumbers ? (
        <span className="w-20 shrink-0 text-right tabular-nums text-shadow-pixel" aria-hidden>
          {Math.round(clamped)}/{safeMax}
        </span>
      ) : null}
    </div>
  );
}
