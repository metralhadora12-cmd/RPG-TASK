import { useState } from 'react';
import { maxHp } from '@/features/progression/formulas';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import { Bar } from '@/ui/Bar';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { Menu } from '@/ui/Menu';
import { palette, themeIds, type ThemeId } from '@/ui/palette';
import { Tabs } from '@/ui/Tabs';
import { Window } from '@/ui/Window';

const DEMO_MENU = [
  { id: 'attack', label: 'Atacar' },
  { id: 'magic', label: 'Magia', hint: '4 MP' },
  { id: 'item', label: 'Item' },
  { id: 'run', label: 'Fugir', disabled: true },
];

/** Vitrine do design system em /dev/ui. */
export function DevUiPage() {
  const theme = useGameStore((s) => s.settings.theme);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const [hp, setHp] = useState(40);
  const [xp, setXp] = useState(30);
  const [picked, setPicked] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const hpMax = maxHp(1);

  return (
    <div className="flex flex-col gap-4">
      <Window title={t('dev.ui.title')}>
        <Tabs<ThemeId>
          aria-label={t('settings.theme')}
          tabs={themeIds.map((id) => ({ id, label: t(`theme.${id}`) }))}
          value={theme}
          onChange={(id) => updateSettings({ theme: id })}
        >
          <p className="text-win-dim">{t('dev.ui.tabs')}: ← →</p>
        </Tabs>
      </Window>

      <div className="grid gap-4 lg:grid-cols-2">
        <Window title={t('dev.ui.bars')}>
          <div className="flex flex-col gap-2">
            <Bar kind="hp" label={t('hud.hp')} value={hp} max={hpMax} />
            <Bar kind="mp" label={t('hud.mp')} value={14} max={22} />
            <Bar kind="xp" label={t('hud.xp')} value={xp} max={75} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="solid" onClick={() => setHp((v) => Math.max(0, v - 9))}>
              {t('dev.ui.damage')}
            </Button>
            <Button variant="solid" onClick={() => setHp(hpMax)}>
              {t('dev.ui.heal')}
            </Button>
            <Button variant="solid" onClick={() => setXp((v) => (v + 20) % 76)}>
              +20 XP
            </Button>
          </div>
        </Window>

        <Window title={t('dev.ui.menu')}>
          <Menu
            aria-label={t('dev.ui.menu')}
            items={DEMO_MENU}
            onSelect={(item) => setPicked(String(item.label))}
          />
          {picked ? <p className="mt-2 text-win-accent">{t('dev.ui.selected', { item: picked })}</p> : null}
        </Window>

        <Window title={t('dev.ui.buttons')}>
          <div className="flex flex-wrap gap-2">
            <Button>Plain</Button>
            <Button variant="solid">Solid</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Window>

        <Window title={t('dev.ui.dialog')}>
          <Button variant="solid" onClick={() => setDialogOpen(true)}>
            {t('dev.ui.openDialog')}
          </Button>
        </Window>
      </div>

      <Window title={t('dev.ui.windows')}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(palette).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1 text-base">
              <span className="inline-block size-5 border-2 border-black" style={{ background: color }} />
              {name}
            </div>
          ))}
        </div>
      </Window>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Mentor"
        text={t('dev.ui.dialogText')}
        actions={[
          { label: t('common.close'), onSelect: () => setDialogOpen(false) },
          { label: t('common.continue'), variant: 'solid', onSelect: () => setDialogOpen(false) },
        ]}
      />
    </div>
  );
}
