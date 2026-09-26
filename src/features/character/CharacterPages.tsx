import { useRef, useState } from 'react';
import { BossPanel } from '@/features/boss/BossPanel';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { maxHp, maxMp, xpToNextLevel } from '@/features/progression/formulas';
import { t, type MessageKey } from '@/lib/i18n';
import { achievements } from '@/features/progression/achievements';
import { Medal } from '@/features/progression/Medal';
import { HeroSprite } from '@/features/shop/HeroSprite';
import { HeroStage } from '@/features/shop/HeroStage';
import type { CharacterPose } from '@/sprites/CharacterSprite';
import { REINCARNATION_LEVEL } from '@/store/characterActions';
import { useGameStore } from '@/store/useGameStore';
import { Bar } from '@/ui/Bar';
import { CursorSlot } from '@/ui/Cursor';
import { showToast } from '@/ui/toastStore';
import { useMenuNavigation } from '@/ui/useMenuNavigation';
import { Window } from '@/ui/Window';
import { CharacterEditor, type CharacterDraft } from './CharacterEditor';
import { statKeys } from './stats';

/** Tela obrigatória no primeiro acesso. */
export function CreateCharacterPage() {
  const character = useGameStore((s) => s.character);
  const createCharacter = useGameStore((s) => s.createCharacter);
  const navigate = useNavigate();
  // A navegação do router roda em transição: sem este flag, o guarda abaixo venceria.
  const created = useRef(false);
  if (character.name && !created.current) return <Navigate to="/personagem/aparencia" replace />;
  return (
    <main id="conteudo" className="mx-auto max-w-5xl p-3 sm:p-6">
      <h1 className="font-title mb-4 text-center text-sm text-win-accent text-shadow-pixel">{t('app.name')}</h1>
      <CharacterEditor
        mode="create"
        level={character.level}
        initial={{ name: '', classId: character.classId, appearance: character.appearance }}
        onConfirm={(draft) => {
          created.current = true;
          createCharacter(draft);
          navigate('/missoes', { replace: true });
        }}
      />
    </main>
  );
}

/** Edição de nome/aparência (grátis) e reencarnação a partir do nível 10. */
export function AppearancePage() {
  const character = useGameStore((s) => s.character);
  const navigate = useNavigate();
  const save = (draft: CharacterDraft) => {
    const store = useGameStore.getState();
    if (draft.classId !== character.classId && store.reincarnate(draft.classId)) {
      showToast({ message: t('status.reincarnate.done', { class: t(`class.${draft.classId}`) }) });
    }
    store.updateAppearance({ name: draft.name, appearance: draft.appearance });
    navigate('/personagem');
  };
  return (
    <CharacterEditor
      mode="edit"
      level={character.level}
      initial={{ name: character.name, classId: character.classId, appearance: character.appearance }}
      onConfirm={save}
      onCancel={() => navigate('/personagem')}
    />
  );
}

const poses: CharacterPose[] = ['idle', 'victory', 'fainted'];

/** Status: sprite, barras, atributos com distribuição de pontos e estatísticas. */
export function StatusPage() {
  const character = useGameStore((s) => s.character);
  const lifetime = useGameStore((s) => s.lifetime);
  const allocatePoint = useGameStore((s) => s.allocatePoint);
  const [pose, setPose] = useState<CharacterPose>('idle');
  const canAllocate = character.unspentPoints > 0;
  const nav = useMenuNavigation({
    count: statKeys.length,
    onSelect: (i) => allocatePoint(statKeys[i]!),
    isDisabled: () => !canAllocate,
  });
  const { level } = character;
  const statsRows: [string, number][] = [
    [t('status.tasksCompleted'), lifetime.tasksCompleted],
    [t('status.xpEarned'), lifetime.xpEarned],
    [t('status.goldEarned'), lifetime.goldEarned],
    [t('status.criticals'), lifetime.criticals],
    [t('status.bestStreak'), lifetime.bestStreak],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Window title={t('status.title')} className="flex flex-col gap-3">
        <HeroStage scale={5} width={320}>
          <HeroSprite pose={pose} scale={3} label={character.name} />
        </HeroStage>
        <div role="group" aria-label={t('status.poses')} className="flex flex-wrap justify-center gap-1">
          {poses.map((p) => (
            <button
              key={p}
              type="button"
              className="px-icon-btn px-2!"
              aria-pressed={pose === p}
              onClick={() => setPose(p)}
            >
              {t(`status.pose.${p}`)}
            </button>
          ))}
        </div>
        <div>
          <h1 className="font-title text-sm text-win-accent text-shadow-pixel">{character.name}</h1>
          <p className="text-shadow-pixel">
            {t('status.levelClass', { level, class: t(`class.${character.classId}`) })}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Bar kind="hp" label={t('hud.hp')} value={character.hp} max={maxHp(level)} />
          <Bar kind="mp" label={t('hud.mp')} value={character.mp} max={maxMp(level)} />
          <Bar kind="xp" label={t('hud.xp')} value={character.xp} max={xpToNextLevel(level)} />
        </div>
        <p className="text-shadow-pixel">
          {character.gold} {t('hud.gold')}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/personagem/aparencia" className="px-btn" data-variant="solid">
            {t('status.appearance')}
          </Link>
          <Link to="/personagem/equipamento" className="px-btn" data-variant="solid">
            {t('equip.open')}
          </Link>
          {level >= REINCARNATION_LEVEL ? (
            <Link to="/personagem/aparencia" className="px-btn">
              {t('status.reincarnate')}
            </Link>
          ) : (
            <p className="text-base text-win-dim">{t('status.reincarnateLocked', { n: REINCARNATION_LEVEL })}</p>
          )}
        </div>
      </Window>

      <div className="flex flex-col gap-4">
        <BossPanel />
        <Window title={t('status.attributes')}>
          <p className="mb-2 text-shadow-pixel" aria-live="polite">
            {canAllocate ? t('status.unspent', { n: character.unspentPoints }) : t('status.noPoints')}
          </p>
          <ul className="flex flex-col gap-0.5" onKeyDown={nav.onKeyDown}>
            {statKeys.map((key, i) => (
              <li key={key}>
                <button
                  type="button"
                  className="px-menu-item"
                  aria-label={`${t(`stat.${key}.name`)}: ${character.stats[key]}${canAllocate ? `. ${t('status.addPoint', { stat: t(`stat.${key}.name`) })}` : ''}`}
                  {...nav.getItemProps(i)}
                >
                  <CursorSlot visible={nav.activeIndex === i} />
                  <span className="font-title w-12 text-[0.6rem] text-win-accent">{t(`stat.${key}`)}</span>
                  <span className="w-28 text-win-dim sm:w-40">{t(`stat.${key}.name`)}</span>
                  <span className="w-10 text-right tabular-nums">{character.stats[key]}</span>
                  {canAllocate ? <span className="ml-3 text-win-accent">+</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </Window>

        <Window title={t('status.stats')}>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
            {statsRows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-win-dim">{label}</dt>
                <dd className="text-right tabular-nums text-shadow-pixel">{value}</dd>
              </div>
            ))}
          </dl>
        </Window>

        <Window title={`${t('status.achievements')} · ${t('ach.count', { n: character.achievements.length, total: achievements.length })}`}>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
            {achievements.map((a) => {
              const unlocked = character.achievements.includes(a.id);
              return (
                <li key={a.id} className="flex items-start gap-2" aria-label={`${t(`ach.${a.id}` as MessageKey)}: ${unlocked ? t(`ach.tier.${a.tier}`) : t('ach.locked')}. ${t(`ach.${a.id}.desc` as MessageKey)}`}>
                  <span className="shrink-0">
                    <Medal achievement={a} unlocked={unlocked} scale={3} />
                  </span>
                  <span className={unlocked ? '' : 'opacity-60'} aria-hidden>
                    <span className="block leading-tight text-shadow-pixel">{t(`ach.${a.id}` as MessageKey)}</span>
                    <span className="block text-base leading-tight text-win-dim">{t(`ach.${a.id}.desc` as MessageKey)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Window>
      </div>
    </div>
  );
}
