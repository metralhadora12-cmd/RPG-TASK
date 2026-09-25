import { useId, useState, type ReactNode } from 'react';
import { t, type MessageKey } from '@/lib/i18n';
import {
  classIds,
  classOutfits,
  eyeColors,
  hairColors,
  hairStyles,
  skinTones,
} from '@/sprites/characterParts';
import { composeCharacter, type Pose } from '@/sprites/compose';
import { SpriteCanvas } from '@/sprites/SpriteCanvas';
import type { Appearance, ClassId } from '@/store/types';
import { Window } from '@/ui/Window';

const poses: Pose[] = ['idle0', 'idle1', 'victory', 'fainted'];

function Cell({ appearance, classId, pose, scale, caption }: { appearance: Appearance; classId: ClassId; pose: Pose; scale: number; caption: string }) {
  return (
    <figure className="flex flex-col items-center gap-1">
      <div className="stage">
        <SpriteCanvas grid={composeCharacter({ appearance, classId }, pose)} scale={scale} />
      </div>
      <figcaption className="max-w-24 truncate text-center text-base text-win-dim">{caption}</figcaption>
    </figure>
  );
}

function Grid({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Window title={title}>
      <div className="flex flex-wrap gap-3">{children}</div>
    </Window>
  );
}

/** Visualizador de todas as combinações de sprite (debug) em /dev/sprites. */
export function DevSpritesPage() {
  const [pose, setPose] = useState<Pose>('idle0');
  const [scale, setScale] = useState(3);
  const [classId, setClassId] = useState<ClassId>('warrior');
  const [base, setBase] = useState<Appearance>({ body: 'a', skin: 2, hairStyle: 0, hairColor: 3, eyes: 0, outfit: 0 });
  const ids = { pose: useId(), scale: useId(), cls: useId(), body: useId() };
  const cell = (patch: Partial<Appearance>, caption: string, cls: ClassId = classId, key = caption) => (
    <Cell key={key} appearance={{ ...base, ...patch }} classId={cls} pose={pose} scale={scale} caption={caption} />
  );

  return (
    <div className="flex flex-col gap-4">
      <Window title={t('dev.sprites.title')}>
        <div className="flex flex-wrap items-center gap-4">
          <label htmlFor={ids.pose}>{t('dev.sprites.pose')}</label>
          <select id={ids.pose} className="px-input w-auto!" value={pose} onChange={(e) => setPose(e.target.value as Pose)}>
            {poses.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <label htmlFor={ids.scale}>{t('dev.sprites.scale')}</label>
          <select id={ids.scale} className="px-input w-auto!" value={scale} onChange={(e) => setScale(Number(e.target.value))}>
            {[1, 2, 3, 4, 6].map((n) => (
              <option key={n} value={n}>
                ×{n}
              </option>
            ))}
          </select>
          <label htmlFor={ids.cls}>{t('character.class')}</label>
          <select id={ids.cls} className="px-input w-auto!" value={classId} onChange={(e) => setClassId(e.target.value as ClassId)}>
            {classIds.map((c) => (
              <option key={c} value={c}>
                {t(`class.${c}`)}
              </option>
            ))}
          </select>
          <label htmlFor={ids.body}>{t('character.body')}</label>
          <select
            id={ids.body}
            className="px-input w-auto!"
            value={base.body}
            onChange={(e) => setBase((b) => ({ ...b, body: e.target.value as Appearance['body'] }))}
          >
            <option value="a">{t('body.a')}</option>
            <option value="b">{t('body.b')}</option>
          </select>
        </div>
      </Window>
      <Grid title={t('character.hairStyle')}>
        {hairStyles.map((h, i) => cell({ hairStyle: i }, t(`hair.${h.id}` as MessageKey)))}
      </Grid>
      <Grid title={t('character.hairColor')}>
        {hairColors.map((c, i) => cell({ hairColor: i }, t(`hairColor.${c.id}` as MessageKey)))}
      </Grid>
      <Grid title={t('character.skin')}>
        {skinTones.map((_, i) => cell({ skin: i }, t('character.skinTone', { n: i + 1 })))}
      </Grid>
      <Grid title={t('character.eyes')}>{eyeColors.map((c, i) => cell({ eyes: i }, t(`eyes.${c.id}` as MessageKey)))}</Grid>
      <Grid title={t('character.outfit')}>
        {classIds.flatMap((cls) =>
          classOutfits[cls].map((o, i) => cell({ outfit: i }, t(`outfit.${o.id}` as MessageKey), cls, o.id)),
        )}
      </Grid>
    </div>
  );
}
