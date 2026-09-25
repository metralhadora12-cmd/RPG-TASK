import { useId, type HTMLAttributes, type ReactNode } from 'react';

export interface WindowProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  /** Elemento semântico da janela. */
  as?: 'section' | 'div' | 'aside' | 'article' | 'nav' | 'header';
  children?: ReactNode;
}

/** Janela de menu estilo JRPG 16-bit (gradiente + borda chanfrada), respeitando o tema. */
export function Window({ title, as: Tag = 'section', className, children, ...rest }: WindowProps) {
  const titleId = useId();
  return (
    <Tag
      className={['win', className].filter(Boolean).join(' ')}
      aria-labelledby={title ? titleId : undefined}
      {...rest}
    >
      {title ? (
        <h2 id={titleId} className="win-title">
          {title}
        </h2>
      ) : null}
      {children}
    </Tag>
  );
}
