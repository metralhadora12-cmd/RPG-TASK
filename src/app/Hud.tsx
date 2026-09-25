import { maxHp, maxMp, xpToNextLevel } from '@/features/progression/formulas';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import { Bar } from '@/ui/Bar';
import { palette } from '@/ui/palette';
import { PixelIcon } from '@/ui/PixelIcon';

// Retrato provisório (a fase 4 troca pelo sprite do personagem).
const PORTRAIT = [
  '...######...',
  '..#GGGGGG#..',
  '.#GGGGGGGG#.',
  '.#GSSSSSSG#.',
  '.#SSKSSKSS#.',
  '.#SSSSSSSS#.',
  '..#SSMMSS#..',
  '...#SSSS#...',
  '..#BBBBBB#..',
  '.#BBBBBBBB#.',
] as const;
const PORTRAIT_COLORS = {
  '#': palette.ink,
  G: palette.gray,
  S: '#f0b890',
  K: palette.ink,
  M: '#c06050',
  B: palette.sky,
};

const COIN = ['.###.', '#YYW#', '#YWY#', '#YYY#', '.###.'] as const;
const COIN_COLORS = { '#': '#8a5a00', Y: palette.gold, W: palette.white };

/** HUD fixo no topo: retrato, nome, nível, barras e Gold. */
export function Hud() {
  const character = useGameStore((s) => s.character);
  const level = character?.level ?? 1;
  const hpMax = maxHp(level);
  const mpMax = maxMp(level);
  const xpMax = xpToNextLevel(level);

  return (
    <header className="win sticky top-0 z-30 rounded-none px-3 py-2 sm:px-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1">
        <PixelIcon matrix={PORTRAIT} colors={PORTRAIT_COLORS} scale={4} className="shrink-0" />
        <div className="min-w-[7rem]">
          <p className="font-title truncate text-[0.7rem] text-shadow-pixel">{character?.name ?? t('hud.noHero')}</p>
          <p className="text-win-accent text-shadow-pixel">
            {t('hud.level')} {level}
          </p>
        </div>
        <div className="grid min-w-[12rem] flex-1 gap-1 sm:grid-cols-3 sm:gap-3">
          <Bar kind="hp" label={t('hud.hp')} value={character?.hp ?? hpMax} max={hpMax} />
          <Bar kind="mp" label={t('hud.mp')} value={character?.mp ?? mpMax} max={mpMax} />
          <Bar kind="xp" label={t('hud.xp')} value={character?.xp ?? 0} max={xpMax} />
        </div>
        <p
          className="flex items-center gap-2 tabular-nums text-shadow-pixel"
          aria-label={t('hud.goldLabel', { amount: character?.gold ?? 0 })}
        >
          <PixelIcon matrix={COIN} colors={COIN_COLORS} scale={3} />
          <span aria-hidden>
            {character?.gold ?? 0} {t('hud.gold')}
          </span>
        </p>
      </div>
    </header>
  );
}
