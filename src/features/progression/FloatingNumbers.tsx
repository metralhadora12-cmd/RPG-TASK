import { AnimatePresence, motion } from 'framer-motion';
import { palette } from '@/ui/palette';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { removeFloat, useFxStore, type FloatKind } from './fxStore';

const colors: Record<FloatKind, string> = {
  xp: palette.xpGoldLight,
  gold: palette.gold,
  critical: palette.rarityLegendary,
  damage: palette.hpRed,
  heal: palette.hpGreen,
};

/** Números "+20 XP" / "+6 G" que sobem e somem a partir do ponto de origem. */
export function FloatingNumbers() {
  const floats = useFxStore((s) => s.floats);
  const reduced = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      <AnimatePresence>
        {floats.map((f) => (
          <motion.span
            key={f.id}
            className="font-title absolute whitespace-nowrap text-[0.7rem]"
            style={{
              left: f.x,
              top: f.y,
              color: colors[f.kind],
              textShadow: `2px 2px 0 ${palette.ink}, -1px -1px 0 ${palette.ink}`,
              fontSize: f.kind === 'critical' ? '0.9rem' : undefined,
            }}
            initial={{ opacity: 0, y: 0, x: '-50%', scale: f.kind === 'critical' ? 1.6 : 1 }}
            animate={{ opacity: [0, 1, 1, 0], y: reduced ? 0 : -56, scale: 1 }}
            transition={{ duration: 1.3, delay: f.delay, ease: 'easeOut', times: [0, 0.1, 0.7, 1] }}
            onAnimationComplete={() => removeFloat(f.id)}
          >
            {f.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
