import { forwardRef, useState, type ButtonHTMLAttributes } from 'react';
import { CursorSlot } from './Cursor';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'plain' | 'solid' | 'danger';
  /** Força o estado "ativo" (cursor visível), usado por menus controlados por teclado. */
  active?: boolean;
}

/** Botão pixel: mostra a mãozinha quando focado, com hover ou ativo. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'plain', active, className, children, type = 'button', onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest },
  ref,
) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const showCursor = !rest.disabled && (active ?? (hover || focus));
  return (
    <button
      ref={ref}
      type={type}
      className={['px-btn', className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-active={showCursor || undefined}
      onMouseEnter={(e) => {
        setHover(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setFocus(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        onBlur?.(e);
      }}
      {...rest}
    >
      <CursorSlot visible={showCursor} />
      {children}
    </button>
  );
});
