import { useEffect, useState } from 'react';
import { gameDayKey } from '@/lib/date';
import { useGameStore } from '@/store/useGameStore';

/** Dia de jogo atual; atualiza sozinho quando o dia vira (Meu Dia reseta). */
export function useToday(): string {
  const dayStartHour = useGameStore((s) => s.settings.dayStartHour);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return gameDayKey(new Date(now), dayStartHour);
}
