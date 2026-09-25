import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import type { ReducedMotionPref } from '@/store/types';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { themeIds, type ThemeId } from '@/ui/palette';
import { Window } from '@/ui/Window';
import { themeItemId } from '@/features/shop/catalog';

function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 py-2 last:border-0">
      <label htmlFor={htmlFor} className="text-shadow-pixel">
        {label}
      </label>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Toggle({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Button id={id} role="switch" aria-checked={checked} variant="solid" onClick={() => onChange(!checked)}>
      {checked ? t('settings.on') : t('settings.off')}
    </Button>
  );
}

export function SettingsPage() {
  const settings = useGameStore((s) => s.settings);
  const update = useGameStore((s) => s.updateSettings);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const inventory = useGameStore((s) => s.character.inventory);
  const ownedThemes = themeIds.filter((id) => {
    const item = themeItemId(id);
    return item && inventory.some((i) => i.itemId === item);
  });
  const [resetStep, setResetStep] = useState<0 | 1 | 2 | 3>(0);

  return (
    <div className="flex flex-col gap-4">
      <Window title={t('settings.title')}>
        <Row label={t('settings.sound')} htmlFor="set-sound">
          <Toggle id="set-sound" checked={settings.soundEnabled} onChange={(v) => update({ soundEnabled: v })} />
        </Row>
        <Row label={t('settings.volume')} htmlFor="set-volume">
          <input
            id="set-volume"
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.volume * 100)}
            onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
            className="accent-(--win-accent)"
          />
          <span className="w-10 text-right tabular-nums">{Math.round(settings.volume * 100)}%</span>
        </Row>
        <Row label={t('settings.penalties')} htmlFor="set-penalties">
          <Toggle
            id="set-penalties"
            checked={settings.penaltiesEnabled}
            onChange={(v) => update({ penaltiesEnabled: v })}
          />
        </Row>
        <Row label={t('settings.readableFont')} htmlFor="set-font">
          <Toggle id="set-font" checked={settings.readableFont} onChange={(v) => update({ readableFont: v })} />
        </Row>
        <Row label={t('settings.reducedMotion')} htmlFor="set-motion">
          <select
            id="set-motion"
            className="px-input w-auto"
            value={settings.reducedMotion}
            onChange={(e) => update({ reducedMotion: e.target.value as ReducedMotionPref })}
          >
            <option value="system">{t('settings.reducedMotion.system')}</option>
            <option value="on">{t('settings.on')}</option>
            <option value="off">{t('settings.off')}</option>
          </select>
        </Row>
        <Row label={t('settings.weekStart')} htmlFor="set-week">
          <select
            id="set-week"
            className="px-input w-auto"
            value={settings.weekStartsOn}
            onChange={(e) => update({ weekStartsOn: Number(e.target.value) as 0 | 1 })}
          >
            <option value={0}>{t('settings.weekStart.sunday')}</option>
            <option value={1}>{t('settings.weekStart.monday')}</option>
          </select>
        </Row>
        <Row label={t('settings.dayStart')} htmlFor="set-daystart">
          <select
            id="set-daystart"
            className="px-input w-auto"
            value={settings.dayStartHour}
            onChange={(e) => update({ dayStartHour: Number(e.target.value) })}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </Row>
        <Row label={t('settings.theme')} htmlFor="set-theme">
          <select
            id="set-theme"
            className="px-input w-auto"
            value={settings.theme}
            onChange={(e) => {
              // Temas são itens da loja: escolher aqui equipa o tema possuído.
              const item = themeItemId(e.target.value as ThemeId);
              const store = useGameStore.getState();
              if (item) store.equipItem(item);
              else store.unequip('theme');
            }}
          >
            {themeIds.filter((id) => id === 'classic' || id === settings.theme || ownedThemes.includes(id)).map((id) => (
              <option key={id} value={id}>
                {t(`theme.${id}`)}
              </option>
            ))}
          </select>
        </Row>
      </Window>

      <Window>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to="/dev/ui" className="text-win-accent underline">
            {t('nav.devUi')}
          </Link>
          <Button variant="danger" onClick={() => setResetStep(1)}>
            {t('settings.reset')}
          </Button>
        </div>
      </Window>

      <Dialog
        open={resetStep === 1}
        onClose={() => setResetStep(0)}
        title={t('settings.reset')}
        text={t('settings.reset.confirm1')}
        actions={[
          { label: t('common.no'), onSelect: () => setResetStep(0) },
          { label: t('common.yes'), variant: 'danger', onSelect: () => setResetStep(2) },
        ]}
      />
      <Dialog
        open={resetStep === 2}
        onClose={() => setResetStep(0)}
        title={t('settings.reset')}
        text={t('settings.reset.confirm2')}
        actions={[
          { label: t('common.no'), onSelect: () => setResetStep(0) },
          {
            label: t('common.yes'),
            variant: 'danger',
            onSelect: () => {
              resetProgress();
              setResetStep(3);
            },
          },
        ]}
      />
      <Dialog
        open={resetStep === 3}
        onClose={() => setResetStep(0)}
        text={t('settings.reset.done')}
        actions={[{ label: t('common.ok'), onSelect: () => setResetStep(0) }]}
      />
    </div>
  );
}
