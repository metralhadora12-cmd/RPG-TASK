import { useEffect, useMemo } from 'react';
import { t, type MessageKey } from '@/lib/i18n';
import { paintLayers } from '@/sprites/compose';
import { expandLayer } from '@/sprites/layers';
import { SpriteCanvas } from '@/sprites/SpriteCanvas';
import { useGameStore } from '@/store/useGameStore';
import { today as todayOf } from '@/store/taskActions';
import { Bar } from '@/ui/Bar';
import { Window } from '@/ui/Window';
import { daysLeftInWeek, type BossId } from './boss';
import { BOSS_ART } from './bossArt';

function BossSprite({ id, scale, defeated }: { id: BossId; scale: number; defeated: boolean }) {
  const { grid, crop } = useMemo(() => {
    const { art, palette } = BOSS_ART[id];
    const rows = expandLayer(art);
    let x0 = 64, x1 = 0, y0 = 64, y1 = 0;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '.') continue;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1);
      }
    });
    return { grid: paintLayers([{ rows, palette }]), crop: { x: [x0, x1] as [number, number], y: [y0, y1] as [number, number] } };
  }, [id]);
  return (
    <span className={defeated ? 'opacity-40 grayscale' : ''}>
      <SpriteCanvas grid={grid} crop={crop} scale={scale} />
    </span>
  );
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
  const id = boss.bossId as BossId;
  const name = t(`boss.${id}` as MessageKey);
  const hp = Math.max(0, boss.maxHp - boss.damage);
  const defeated = Boolean(boss.defeatedAt);
  const days = daysLeftInWeek(day, weekStartsOn);

  const body = (
    <div className="flex items-center gap-3">
      <BossSprite id={id} scale={compact ? 2 : 4} defeated={defeated} />
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
