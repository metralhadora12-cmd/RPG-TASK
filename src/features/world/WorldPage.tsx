import { Html } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { bossForWeek, isBossId } from '@/features/boss/boss';
import { t, type MessageKey } from '@/lib/i18n';
import { today as todayOf } from '@/store/taskActions';
import { useGameStore } from '@/store/useGameStore';
import { Bar } from '@/ui/Bar';
import { Button } from '@/ui/Button';
import { worldPalette as W } from '@/ui/palette';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { Window } from '@/ui/Window';
import { Boss3D } from './Boss3D';
import { Hero3D, type Pose3D } from './Hero3D';
import { heroLook3D, petLook3D } from './look3d';
import { Pet3D } from './Pet3D';
import { dampFactor, getPlace, OVERVIEW, PLACES, type PlaceId, type Vec3 } from './places';
import { QuestBoard } from './QuestBoard';
import { Village } from './Village';

const VICTORY_MS = 1800;

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Câmera que desliza até o lugar escolhido (ou para a visão geral). */
function CameraRig({ focus, instant }: { focus: PlaceId | null; instant: boolean }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(...OVERVIEW.target));
  const goal = useMemo(() => {
    const p = focus ? getPlace(focus) : null;
    return { pos: new THREE.Vector3(...(p?.camera ?? OVERVIEW.camera)), look: new THREE.Vector3(...(p?.target ?? OVERVIEW.target)) };
  }, [focus]);
  useFrame((_, dt) => {
    const k = instant ? 1 : dampFactor(3.5, Math.min(dt, 0.1));
    camera.position.lerp(goal.pos, k);
    target.current.lerp(goal.look, k);
    camera.lookAt(target.current);
  });
  return null;
}

/** Pose do herói: comemora após cada recompensa e desmaia com HP 0. */
function useHeroPose(): Pose3D {
  const hp = useGameStore((s) => s.character.hp);
  const lastReward = useGameStore((s) => {
    const e = s.rewardLog.at(-1);
    return e && !e.revertedAt && (e.kind === 'complete' || e.kind === 'habitUp' || e.kind === 'boss') ? e.id : null;
  });
  const [cheering, setCheering] = useState(false);
  const first = useRef(lastReward);
  useEffect(() => {
    if (!lastReward || lastReward === first.current) return;
    setCheering(true);
    const timer = window.setTimeout(() => setCheering(false), VICTORY_MS);
    return () => window.clearTimeout(timer);
  }, [lastReward]);
  if (hp <= 0) return 'fainted';
  return cheering ? 'victory' : 'idle';
}

function Scene({ focus, onSelect, still }: { focus: PlaceId | null; onSelect: (id: PlaceId) => void; still: boolean }) {
  const character = useGameStore((s) => s.character);
  const boss = useGameStore((s) => s.boss);
  const look = useMemo(() => heroLook3D(character), [character]);
  const pet = useMemo(() => petLook3D(character.equipped.pet), [character.equipped.pet]);
  const pose = useHeroPose();
  const bossId = boss ? (isBossId(boss.bossId) ? boss.bossId : bossForWeek(boss.week)) : null;
  const bossHp = boss ? Math.max(0, boss.maxHp - boss.damage) : 0;

  return (
    <>
      <color attach="background" args={[W.sky]} />
      <fog attach="fog" args={[W.skyFog, 22, 45]} />
      <hemisphereLight args={[W.skyFog, W.grassDark, 1.1]} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <CameraRig focus={focus} instant={still} />
      <Village
        onSelect={onSelect}
        attachments={{
          board: <QuestBoard />,
          arena:
            boss && bossId ? (
              <group position={[0, 0.12, -0.2]} rotation={[0, -0.5, 0]}>
                <Boss3D bossId={bossId} damage={boss.damage} defeated={Boolean(boss.defeatedAt)} still={still} />
                <Html position={[0, 2.7, 0]} center zIndexRange={[15, 0]}>
                  <div className="win w-40 px-2 py-1 text-center" onPointerDown={(e) => e.stopPropagation()}>
                    <p className="font-title text-[0.5rem] text-win-accent">{t(`boss.${bossId}` as MessageKey)}</p>
                    <Bar kind="hp" value={bossHp} max={boss.maxHp} label="HP" />
                  </div>
                </Html>
              </group>
            ) : null,
        }}
      />
      <group position={[1.5, 0, -0.5]} rotation={[0, -0.3, 0]}>
        <Hero3D look={look} pose={pose} still={still} />
      </group>
      {pet && (
        <group position={[2.2, 0, -0.1]} rotation={[0, -0.5, 0]}>
          <Pet3D look={pet} pose={pose} still={still} />
        </group>
      )}
    </>
  );
}

/** Vila 3D em cel-shading: cada prédio leva a uma seção do app. */
export function WorldPage() {
  const navigate = useNavigate();
  const still = useReducedMotion();
  const syncBoss = useGameStore((s) => s.syncBoss);
  const weekStartsOn = useGameStore((s) => s.settings.weekStartsOn);
  const [focus, setFocus] = useState<PlaceId | null>(null);
  const [webgl] = useState(hasWebGL);
  const day = todayOf(useGameStore.getState);

  useEffect(() => {
    syncBoss();
  }, [syncBoss, day, weekStartsOn]);

  // Clicar no prédio aproxima a câmera; clicar de novo entra na seção.
  const select = (id: PlaceId) => {
    const route = getPlace(id).route;
    if (focus === id && route) navigate(route);
    else setFocus(id);
  };
  const place = focus ? getPlace(focus) : null;

  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden">
      <h1 className="sr-only">{t('world.title')}</h1>
      {webgl ? (
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: OVERVIEW.camera as Vec3, fov: 40, near: 0.1, far: 100 }}
          aria-label={t('world.canvasLabel')}
          role="img"
          onPointerMissed={() => setFocus(null)}
        >
          <Scene focus={focus} onSelect={select} still={still} />
        </Canvas>
      ) : (
        <Window className="m-4">{t('world.unsupported')}</Window>
      )}
      <Window as="nav" aria-label={t('world.places')} className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)]">
        <ul className="flex gap-1 overflow-x-auto md:flex-wrap">
          <li>
            <Button variant={focus === null ? 'solid' : 'plain'} className="whitespace-nowrap" onClick={() => setFocus(null)}>
              {t('world.overview')}
            </Button>
          </li>
          {PLACES.map((p) => (
            <li key={p.id}>
              <Button variant={focus === p.id ? 'solid' : 'plain'} className="whitespace-nowrap" onClick={() => select(p.id)}>
                {t(p.label)}
              </Button>
            </li>
          ))}
        </ul>
        {place?.route && (
          <div className="mt-2 flex justify-end">
            <Button variant="solid" onClick={() => navigate(place.route!)}>
              {t('world.enter')} ▸ {t(place.label)}
            </Button>
          </div>
        )}
      </Window>
    </div>
  );
}
