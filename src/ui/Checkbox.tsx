import { palette } from './palette';
import { PixelIcon } from './PixelIcon';

const CHECK = ['.......##', '......##.', '##...##..', '.##.##...', '..###....', '...#.....'] as const;

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

/** Caixa de seleção pixel (botão com role="checkbox"). */
export function Checkbox({ checked, onChange, label, className }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={['px-check', className].filter(Boolean).join(' ')}
    >
      {checked ? <PixelIcon matrix={CHECK} colors={{ '#': palette.hpGreen }} scale={2} /> : null}
    </button>
  );
}
