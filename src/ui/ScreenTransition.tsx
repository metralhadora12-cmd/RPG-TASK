import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from './useReducedMotion';

const STRIPES = 8;
const DURATION = 420;

/** Primeiro segmento do caminho: trocar de lista não é trocar de tela. */
const section = (pathname: string) => pathname.split('/')[1] ?? '';

/** Transição "fade em faixas" ao mudar de seção (Missões, Personagem, Loja, Menu). */
export function ScreenTransition() {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const previous = useRef(section(pathname));
  const [run, setRun] = useState(0);

  useEffect(() => {
    const current = section(pathname);
    if (current === previous.current) return;
    previous.current = current;
    if (reduced) return;
    setRun((n) => n + 1);
    const timer = window.setTimeout(() => setRun(0), DURATION + 80);
    return () => window.clearTimeout(timer);
  }, [pathname, reduced]);

  if (!run) return null;
  return (
    <div key={run} aria-hidden className="pointer-events-none fixed inset-0 z-[55] flex flex-col">
      {Array.from({ length: STRIPES }, (_, i) => (
        <div
          key={i}
          className="screen-stripe flex-1"
          style={{ animationDelay: `${i * 25}ms`, animationDuration: `${DURATION - STRIPES * 25}ms` }}
        />
      ))}
    </div>
  );
}
