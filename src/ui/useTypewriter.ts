import { useCallback, useEffect, useState } from 'react';

/**
 * Revela `text` caractere a caractere (efeito de diálogo de JRPG).
 * Com `instant`, mostra tudo de uma vez.
 */
export function useTypewriter(text: string, { charsPerSecond = 45, instant = false } = {}) {
  const [count, setCount] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (instant) {
      setCount(text.length);
      return;
    }
    setCount(0);
    const interval = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, 1000 / charsPerSecond);
    return () => window.clearInterval(interval);
  }, [text, charsPerSecond, instant]);

  const skip = useCallback(() => setCount(text.length), [text]);
  return { shown: text.slice(0, count), done: count >= text.length, skip };
}
