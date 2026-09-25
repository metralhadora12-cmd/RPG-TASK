import { useCallback, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { t, type MessageKey } from '@/lib/i18n';
import {
  appearanceLimits,
  classBaseStats,
  classIds,
  classOutfits,
  eyeColors,
  hairColors,
  hairStyles,
  skinTones,
} from '@/sprites/characterParts';
import { CharacterSprite } from '@/sprites/CharacterSprite';
import { NAME_MAX_LENGTH, REINCARNATION_LEVEL } from '@/store/characterActions';
import type { Appearance, ClassId } from '@/store/types';
import { CursorSlot } from '@/ui/Cursor';
import { Dialog } from '@/ui/Dialog';
import { useMenuNavigation } from '@/ui/useMenuNavigation';
import { Window } from '@/ui/Window';
import { D20Face, useD20Roll } from './D20';
import { randomAppearance, randomClass, randomName } from './random';
import { statKeys } from './stats';

type CycleId = 'class' | 'body' | 'skin' | 'hairStyle' | 'hairColor' | 'eyes' | 'outfit';
type RowId = 'name' | CycleId | 'random' | 'confirm';

const ROWS: RowId[] = ['name', 'class', 'body', 'skin', 'hairStyle', 'hairColor', 'eyes', 'outfit', 'random', 'confirm'];

const rowLabel: Record<CycleId, MessageKey> = {
  class: 'character.class',
  body: 'character.body',
  skin: 'character.skin',
  hairStyle: 'character.hairStyle',
  hairColor: 'character.hairColor',
  eyes: 'character.eyes',
  outfit: 'character.outfit',
};

const wrap = (value: number, delta: number, count: number) => (((value + delta) % count) + count) % count;

export interface CharacterDraft {
  name: string;
  classId: ClassId;
  appearance: Appearance;
}

export interface CharacterEditorProps {
  mode: 'create' | 'edit';
  initial: CharacterDraft;
  /** Nível atual (a classe só muda a partir do nível de reencarnação). */
  level: number;
  onConfirm: (draft: CharacterDraft) => void;
  onCancel?: () => void;
}

function Swatch({ color }: { color: string }) {
  return <span className="inline-block size-4 shrink-0 border-2" style={{ background: color, borderColor: '#08081c' }} />;
}

/** Menu de criação/edição do herói com prévia ao vivo. */
export function CharacterEditor({ mode, initial, level, onConfirm, onCancel }: CharacterEditorProps) {
  const [draft, setDraft] = useState<CharacterDraft>(initial);
  const [error, setError] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [confirmReincarnation, setConfirmReincarnation] = useState(false);
  const nameId = useId();
  const hintId = useId();
  const celebrateTimer = useRef<number>(undefined);
  const classLocked = mode === 'edit' && level < REINCARNATION_LEVEL;
  const { appearance, classId } = draft;

  const flashVictory = () => {
    setCelebrate(true);
    window.clearTimeout(celebrateTimer.current);
    celebrateTimer.current = window.setTimeout(() => setCelebrate(false), 900);
  };

  const onRoll = useCallback(() => {
    setDraft((d) => ({
      name: mode === 'create' && !d.name.trim() ? randomName() : d.name,
      classId: mode === 'create' ? randomClass() : d.classId,
      appearance: randomAppearance(),
    }));
    flashVictory();
  }, [mode]);
  const dice = useD20Roll(onRoll);

  const setAppearance = (patch: Partial<Appearance>) => setDraft((d) => ({ ...d, appearance: { ...d.appearance, ...patch } }));

  const cycle = (id: CycleId, delta: number) => {
    switch (id) {
      case 'class':
        if (!classLocked) setDraft((d) => ({ ...d, classId: classIds[wrap(classIds.indexOf(d.classId), delta, classIds.length)]! }));
        return;
      case 'body':
        return setAppearance({ body: appearance.body === 'a' ? 'b' : 'a' });
      default:
        return setAppearance({ [id]: wrap(appearance[id], delta, appearanceLimits[id]) });
    }
  };

  const confirm = () => {
    if (!draft.name.trim()) {
      setError(t('character.nameRequired'));
      nav.setActiveIndex(0);
      return;
    }
    setError('');
    if (mode === 'edit' && draft.classId !== initial.classId) {
      setConfirmReincarnation(true);
      return;
    }
    onConfirm(draft);
  };

  const valueOf = (id: CycleId): { text: string; swatch?: string } => {
    switch (id) {
      case 'class':
        return { text: t(`class.${classId}`) };
      case 'body':
        return { text: t(`body.${appearance.body}`) };
      case 'skin':
        return { text: t('character.skinTone', { n: appearance.skin + 1 }), swatch: skinTones[appearance.skin]!.s };
      case 'hairStyle':
        return { text: t(`hair.${hairStyles[appearance.hairStyle]!.id}` as MessageKey) };
      case 'hairColor': {
        const c = hairColors[appearance.hairColor]!;
        return { text: t(`hairColor.${c.id}` as MessageKey), swatch: c.palette.h };
      }
      case 'eyes': {
        const c = eyeColors[appearance.eyes]!;
        return { text: t(`eyes.${c.id}` as MessageKey), swatch: c.palette.e };
      }
      case 'outfit': {
        const o = classOutfits[classId][appearance.outfit]!;
        return { text: t(`outfit.${o.id}` as MessageKey), swatch: o.palette.c ?? o.palette.m };
      }
    }
  };

  const nav = useMenuNavigation({
    count: ROWS.length,
    onSelect: (i) => {
      const id = ROWS[i]!;
      if (id === 'name') nav.setActiveIndex(1);
      else if (id === 'random') dice.roll();
      else if (id === 'confirm') confirm();
      else cycle(id, 1);
    },
    onCancel,
  });

  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const id = ROWS[nav.activeIndex]!;
    if (target.tagName === 'INPUT') {
      // No campo de nome, só ↑/↓/Enter navegam; o resto é digitação.
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') nav.onKeyDown(e);
      return;
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && id !== 'name' && id !== 'random' && id !== 'confirm') {
      e.preventDefault();
      cycle(id, e.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    nav.onKeyDown(e);
  };

  const row = (id: RowId, i: number): ReactNode => {
    const active = nav.activeIndex === i;
    const itemProps = nav.getItemProps(i);
    if (id === 'name') {
      return (
        <li key={id} className="relative flex items-center gap-2 py-1 pl-[30px]">
          <CursorSlot visible={active} />
          <label htmlFor={nameId} className="w-24 shrink-0 sm:w-32 text-win-dim">
            {t('character.name')}
          </label>
          <input
            id={nameId}
            {...itemProps}
            onClick={undefined}
            className="px-input"
            value={draft.name}
            maxLength={NAME_MAX_LENGTH}
            placeholder={t('character.namePlaceholder')}
            autoComplete="off"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? `${nameId}-err` : undefined}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </li>
      );
    }
    if (id === 'random') {
      return (
        <li key={id} className="mt-2">
          <button type="button" className="px-menu-item" aria-busy={dice.rolling} {...itemProps}>
            <CursorSlot visible={active} />
            <D20Face face={dice.face} rolling={dice.rolling} />
            <span className="font-title ml-3 text-[0.65rem]">{t('character.random')}</span>
            <span className="ml-3 text-win-dim" role="status">
              {dice.rolling ? t('character.rolling') : dice.face !== null ? t('character.rolled', { n: dice.face }) : ''}
            </span>
          </button>
        </li>
      );
    }
    if (id === 'confirm') {
      return (
        <li key={id}>
          <button type="button" className="px-menu-item mt-1" {...itemProps}>
            <CursorSlot visible={active} />
            <span className="font-title text-[0.7rem] text-win-accent">
              {t(mode === 'create' ? 'character.start' : 'character.save')}
            </span>
          </button>
        </li>
      );
    }
    const label = t(rowLabel[id]);
    const value = valueOf(id);
    const disabled = id === 'class' && classLocked;
    return (
      <li key={id} className="flex items-center">
        <button
          type="button"
          className="px-menu-item min-w-0 flex-1"
          aria-label={t('character.value', { label, value: value.text })}
          aria-describedby={disabled ? `${hintId}-lock` : hintId}
          aria-disabled={disabled || undefined}
          {...itemProps}
        >
          <CursorSlot visible={active} />
          <span className="w-24 shrink-0 sm:w-32 text-win-dim">{label}</span>
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {value.swatch ? <Swatch color={value.swatch} /> : null}
            <span className={['truncate', disabled ? 'opacity-60' : ''].join(' ')}>{value.text}</span>
          </span>
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className="px-icon-btn text-win-accent disabled:opacity-30"
          aria-label={t('character.prev', { label })}
          onClick={() => cycle(id, -1)}
        >
          ◂
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className="px-icon-btn text-win-accent disabled:opacity-30"
          aria-label={t('character.next', { label })}
          onClick={() => cycle(id, 1)}
        >
          ▸
        </button>
      </li>
    );
  };

  const base = classBaseStats[classId];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <Window title={t('character.preview')}>
          <div className="stage flex justify-center">
            <CharacterSprite
              look={{ appearance, classId }}
              pose={celebrate ? 'victory' : 'idle'}
              scale={6}
              label={`${draft.name || t('hud.noHero')} — ${t(`class.${classId}`)}`}
            />
          </div>
          <p className="font-title mt-3 text-center text-[0.7rem] text-shadow-pixel">{draft.name || '???'}</p>
        </Window>
        <Window title={t(`class.${classId}`)} aria-live="polite">
          <p className="text-shadow-pixel">{t(`class.${classId}.desc`)}</p>
          <p className="mt-2">
            <span className="text-win-accent">{t('character.bonus')}: </span>
            {t(`class.${classId}.bonus`)}
          </p>
          <p className="mt-2 text-win-dim">
            {t('character.baseStats')}: {statKeys.map((k) => `${t(`stat.${k}`)} ${base[k]}`).join(' · ')}
          </p>
          {classLocked ? (
            <p id={`${hintId}-lock`} className="mt-2 text-win-dim">
              {t('character.classLocked', { n: REINCARNATION_LEVEL })}
            </p>
          ) : null}
        </Window>
      </div>

      <Window title={t(mode === 'create' ? 'character.create.title' : 'character.edit.title')}>
        {mode === 'create' ? <p className="mb-3 text-shadow-pixel">{t('character.create.intro')}</p> : null}
        <p id={hintId} className="sr-only">
          {t('character.optionHint')}
        </p>
        <ul aria-label={t('character.options')} className="flex flex-col gap-0.5" onKeyDown={onKeyDown}>
          {ROWS.map(row)}
        </ul>
        {error ? (
          <p id={`${nameId}-err`} role="alert" className="mt-3 text-win-accent">
            {error}
          </p>
        ) : null}
        <p className="mt-3 hidden text-base text-win-dim md:block">↑ ↓ · ← → · Enter{onCancel ? ' · Esc' : ''}</p>
      </Window>

      <Dialog
        open={confirmReincarnation}
        onClose={() => setConfirmReincarnation(false)}
        title={t('status.reincarnate')}
        text={t('status.reincarnate.confirm', { class: t(`class.${classId}`) })}
        actions={[
          { label: t('common.no'), onSelect: () => setConfirmReincarnation(false) },
          {
            label: t('common.yes'),
            variant: 'solid',
            onSelect: () => {
              setConfirmReincarnation(false);
              onConfirm(draft);
            },
          },
        ]}
      />
    </div>
  );
}
