import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useToday } from '@/features/tasks/useToday';
import { formatDay } from '@/lib/date';
import { t } from '@/lib/i18n';
import { CharacterSprite } from '@/sprites/CharacterSprite';
import { useGameStore } from '@/store/useGameStore';
import type { NightReport } from '@/store/types';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { palette } from '@/ui/palette';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { Window } from '@/ui/Window';
import { hitScreen, useFxStore } from './fxStore';

/** Fecha o dia na abertura do app e sempre que o dia de jogo virar com ele aberto. */
export function useDayCycle() {
  const today = useToday();
  const named = useGameStore((s) => Boolean(s.character.name));
  useEffect(() => {
    if (!named) return;
    const report = useGameStore.getState().processDayRollover();
    if (report && report.hpLost > 0) hitScreen();
  }, [today, named]);
}

/** Tremida da tela + flash vermelho a cada dano (desligados com movimento reduzido). */
export function DamageFx() {
  const hitKey = useFxStore((s) => s.hitKey);
  const reduced = useReducedMotion();
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    if (hitKey === 0 || reduced) return;
    setFlash(hitKey);
    const root = document.getElementById('root');
    root?.animate?.(
      [
        { transform: 'translate(0, 0)' },
        { transform: 'translate(-6px, 2px)' },
        { transform: 'translate(5px, -2px)' },
        { transform: 'translate(-4px, 1px)' },
        { transform: 'translate(3px, 0)' },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 380, easing: 'steps(5)' },
    );
    // O flash some sozinho mesmo se a animação não terminar (aba em segundo plano).
    const timer = window.setTimeout(() => setFlash(0), 400);
    return () => window.clearTimeout(timer);
  }, [hitKey, reduced]);

  if (!flash) return null;
  return <div key={flash} aria-hidden className="damage-flash pointer-events-none fixed inset-0 z-[65]" />;
}

function reportText(report: NightReport): string {
  const lines = [t('night.intro', { date: formatDay(report.day, "d 'de' MMMM") })];
  if (report.missed.length === 0) lines.push(t('night.allDone'));
  if (report.completed.length > 0) lines.push(t('night.completed', { n: report.completed.length }));
  if (report.faint) lines.push(t('night.fainted'));
  return lines.join('\n');
}

/** "Relatório da noite": aparece na primeira abertura do dia. */
export function NightReportDialog() {
  const report = useGameStore((s) => s.pendingReport);
  const levelUp = useFxStore((s) => s.levelUp);
  const dismiss = useGameStore((s) => s.dismissReport);
  if (!report || levelUp) return null;
  return (
    <Dialog
      open
      onClose={dismiss}
      title={t('night.title')}
      text={reportText(report)}
      actions={[{ label: t('common.continue'), variant: 'solid', onSelect: dismiss }]}
    >
      {report.missed.length > 0 ? (
        <div className="mt-2">
          <p className="font-title text-[0.55rem] text-win-accent">{t('night.missed')}</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {report.missed.map((m, i) => (
              <li key={i}>
                {report.penaltiesEnabled
                  ? t('night.missedItem', { title: m.title, n: m.damage })
                  : t('night.missedNoDamage', { title: m.title })}
              </li>
            ))}
          </ul>
          {report.hpLost > 0 ? <p className="mt-1 text-win-accent">{t('night.hpLost', { n: report.hpLost })}</p> : null}
        </div>
      ) : null}
      {report.streaksLost.length > 0 ? (
        <ul className="mt-2 text-win-dim">
          {report.streaksLost.map((s, i) => (
            <li key={i}>{t('night.streakLost', { title: s.title, n: s.streak })}</li>
          ))}
        </ul>
      ) : null}
    </Dialog>
  );
}

/** Tela de desmaio (Game Over) com o herói caído e as perdas. */
export function GameOverOverlay() {
  const faint = useGameStore((s) => s.pendingFaint);
  const reportOpen = useGameStore((s) => Boolean(s.pendingReport));
  const character = useGameStore((s) => s.character);
  const dismiss = useGameStore((s) => s.dismissFaint);
  const reduced = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const visible = Boolean(faint) && !reportOpen;

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => buttonRef.current?.focus(), reduced ? 0 : 900);
    return () => window.clearTimeout(timer);
  }, [visible, reduced]);

  return (
    <AnimatePresence>
      {visible && faint ? (
        <motion.div
          key="game-over"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="game-over-title"
          aria-describedby="game-over-body"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 p-4"
          style={{ background: '#000' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.6 }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') dismiss();
          }}
        >
          <motion.h2
            id="game-over-title"
            className="font-title text-center text-3xl sm:text-5xl"
            style={{ color: palette.hpRed, textShadow: `4px 4px 0 ${palette.ink}` }}
            initial={reduced ? false : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.3, duration: 0.5 }}
          >
            {t('faint.title')}
          </motion.h2>
          <CharacterSprite look={character} pose="fainted" scale={5} animate={false} />
          <Window className="max-w-md">
            <p className="font-title mb-2 text-[0.7rem] text-win-accent">{t('faint.subtitle')}</p>
            <div id="game-over-body">
              <p className="text-shadow-pixel">{t('faint.body')}</p>
              <ul className="mt-2">
                <li>{t('faint.xp', { level: faint.level, n: faint.xpLost })}</li>
                <li>{t('faint.gold', { n: faint.goldLost })}</li>
              </ul>
            </div>
            <div className="mt-3 flex justify-end">
              <Button ref={buttonRef} variant="solid" onClick={dismiss}>
                {t('faint.continue')}
              </Button>
            </div>
          </Window>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
