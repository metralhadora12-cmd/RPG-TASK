import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { t } from '@/lib/i18n';
import { Button } from '@/ui/Button';
import { palette } from '@/ui/palette';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { Window } from '@/ui/Window';
import { closeLevelUp, useFxStore } from './fxStore';
import { maxHp, maxMp } from './formulas';

function Row({ label, from, to }: { label: string; from: number | string; to: number | string }) {
  return (
    <tr>
      <th scope="row" className="pr-4 text-left font-normal text-win-dim">
        {label}
      </th>
      <td className="tabular-nums">{from}</td>
      <td className="px-2 text-win-accent" aria-hidden>
        ▸
      </td>
      <td className="tabular-nums text-win-accent">{to}</td>
    </tr>
  );
}

/** Tela cheia de "LEVEL UP!": flash, texto pulando e resumo dos ganhos. */
export function LevelUpOverlay() {
  const info = useFxStore((s) => s.levelUp);
  const reduced = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!info) return;
    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => buttonRef.current?.focus(), reduced ? 0 : 700);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLevelUp();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [info, reduced]);

  return (
    <AnimatePresence>
      {info ? (
        <motion.div
          key="level-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-up-title"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 p-4"
          style={{ background: 'rgb(0 0 12 / 0.8)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {!reduced ? (
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{ background: palette.white }}
              initial={{ opacity: 0.9 }}
              animate={{ opacity: [0.9, 0, 0.5, 0] }}
              transition={{ duration: 0.6, times: [0, 0.3, 0.45, 1] }}
            />
          ) : null}
          <motion.h2
            id="level-up-title"
            className="font-title text-center text-3xl sm:text-5xl"
            style={{
              color: palette.xpGoldLight,
              textShadow: `4px 4px 0 ${palette.ink}, -2px -2px 0 ${palette.rarityLegendary}`,
            }}
            initial={reduced ? false : { scale: 0.2, y: -40 }}
            animate={reduced ? undefined : { scale: [0.2, 1.25, 1], y: [-40, 0, 0] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {t('progress.levelUp')}
          </motion.h2>
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.5 }}
          >
            <Window title={t('progress.levelUp.title')} className="min-w-[16rem]">
              <table className="text-shadow-pixel">
                <tbody>
                  <Row label={t('progress.levelUp.level')} from={info.fromLevel} to={info.toLevel} />
                  <Row label={t('progress.levelUp.hp')} from={maxHp(info.fromLevel)} to={maxHp(info.toLevel)} />
                  <Row label={t('progress.levelUp.mp')} from={maxMp(info.fromLevel)} to={maxMp(info.toLevel)} />
                  <Row label={t('progress.levelUp.points')} from="" to={`+${info.pointsGained}`} />
                </tbody>
              </table>
              <p className="mt-2 text-win-dim">{t('progress.levelUp.restored')}</p>
              <div className="mt-3 flex justify-end">
                <Button ref={buttonRef} variant="solid" onClick={closeLevelUp}>
                  {t('common.continue')}
                </Button>
              </div>
            </Window>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
