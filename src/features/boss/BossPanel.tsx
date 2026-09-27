import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { t, type MessageKey } from '@/lib/i18n';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { useGameStore } from '@/store/useGameStore';
import { today as todayOf } from '@/store/taskActions';
import { Bar } from '@/ui/Bar';
import { Window } from '@/ui/Window';
import { bossForWeek, daysLeftInWeek, isBossId, type BossId } from './boss';
import { BOSS_ART, BOSS_FRAME } from './bossArt';

/** Chefe animado: parado em loop, dano quando leva um golpe e morte (fica caído) quando derrotado. */
function BossSprite({ id, scale, damage, defeated }: { id: BossId; scale: number; damage: number; defeated: boolean }) {
  const reduced = useReducedMotion();
  const [hurt, setHurt] = useState(false);
  const last = useRef(damage);
  useEffect(() => {
    if (damage > last.current && !defeated) {
      setHurt(true);
      const timer = window.setTimeout(() => setHurt(false), 480);
      last.current = damage;
      return () => window.clearTimeout(timer);
    }
    last.current = damage;
  }, [damage, defeated]);

  const anim = defeated ? 'death' : hurt ? 'hurt' : 'idle';
  const { src, frames } = BOSS_ART[id][anim];
  const w = BOSS_FRAME.width * scale;
  const h = BOSS_FRAME.height * scale;
  const moving = !reduced;
  const style: CSSProperties & Record<'--strip-w', string> = {
    width: w,
    height: h,
    backgroundImage: `url(${src})`,
    backgroundSize: `${w * frames}px ${h}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    // Sem animação: mostra o primeiro quadro (ou o último, caído, se derrotado).
    backgroundPositionX: !moving && defeated ? -w * (frames - 1) : 0,
    // Loop: anda a tira inteira. Morte: para no último quadro (monstro caído).
    '--strip-w': `${anim === 'death' ? -w * (frames - 1) : -w * frames}px`,
    animation: moving
      ? anim === 'idle'
        ? `boss-strip 0.9s steps(${frames}) infinite`
        : anim === 'hurt'
          ? `boss-strip 0.48s steps(${frames}) 1`
          : `boss-strip 0.8s steps(${frames - 1}, jump-end) 1 forwards`
      : undefined,
  };
  // A chave reinicia a animação ao trocar de estado.
  return <span key={anim} aria-hidden className="inline-block shrink-0" style={style} />;
}

/** Chefe da semana: HP, dias restantes e a recompensa quando cai. */
export function BossPanel({ compact = false }: { compact?: boolean }) {
  const boss = useGameStore((s) => s.boss);
  const syncBoss = useGameStore((s) => s.syncBoss);
  const weekStartsOn = useGameStore((s) => s.settings.weekStartsOn);
  const day = todayOf(useGameStore.getState);

  // Chefe novo quando a semana vira (ou na primeira visita).
  useEffect(() => {
    syncBoss();
  }, [syncBoss, day, weekStartsOn]);

  if (!boss) return null;
  const id: BossId = isBossId(boss.bossId) ? boss.bossId : bossForWeek(boss.week);
  const name = t(`boss.${id}` as MessageKey);
  const hp = Math.max(0, boss.maxHp - boss.damage);
  const defeated = Boolean(boss.defeatedAt);
  const days = daysLeftInWeek(day, weekStartsOn);

  const body = (
    <div className="flex items-center gap-3">
      <BossSprite id={id} scale={compact ? 2 : 4} damage={boss.damage} defeated={defeated} />
      <div className="min-w-0 flex-1">
        <p className="font-title truncate text-[0.6rem] text-win-accent text-shadow-pixel">{name}</p>
        <Bar kind="hp" label={t('hud.hp')} value={hp} max={boss.maxHp} showNumbers={!compact} className="mt-1" />
        <p className="mt-1 text-base text-win-dim" aria-live="polite">
          {defeated ? t('boss.defeated') : compact ? t('boss.hpShort', { hp, max: boss.maxHp }) : t('boss.daysLeft', { n: days })}
        </p>
      </div>
    </div>
  );

  if (compact) {
    return (
      <Window title={t('boss.title')}>
        {body}
      </Window>
    );
  }
  return (
    <Window title={t('boss.title')}>
      {body}
      <p className="mt-2 text-shadow-pixel">{t(`boss.${id}.desc` as MessageKey)}</p>
      <p className="mt-1 text-base text-win-dim">{t('boss.howTo')}</p>
    </Window>
  );
}
