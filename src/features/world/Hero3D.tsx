import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { worldPalette } from '@/ui/palette';
import type { HeroLook3D } from './look3d';
import { Toon } from './toon';

export type Pose3D = 'idle' | 'victory' | 'fainted';

const HEAD_Y = 1.12;
const HEAD_R = 0.38;

/** Cabelo por estilo: calota + volumes extras. */
function Hair({ look }: { look: HeroLook3D }) {
  const c = look.hair;
  const d = look.hairShade;
  // Calota no topo + nuca (meia esfera de trás), deixando a testa e o rosto livres.
  const cap = (scale: [number, number, number] = [1.08, 1.04, 1.08], y = 0.03, theta = Math.PI * 0.36) => (
    <>
      <Toon color={c} position={[0, y, -0.01]} scale={scale}>
        <sphereGeometry args={[HEAD_R, 24, 16, 0, Math.PI * 2, 0, theta]} />
      </Toon>
      <Toon color={c} position={[0, y - 0.02, -0.02]} scale={scale}>
        <sphereGeometry args={[HEAD_R, 24, 16, Math.PI, Math.PI, 0, Math.PI * 0.68]} />
      </Toon>
    </>
  );
  // Franja: gomos na frente da testa.
  const bangs = (
    <group position={[0, 0.16, 0.26]}>
      {[-0.16, 0, 0.16].map((x) => (
        <Toon key={x} color={c} position={[x, 0, 0]} rotation={[0.5, 0, x * -1.2]} scale={[1, 1.3, 0.7]}>
          <sphereGeometry args={[0.1, 10, 8]} />
        </Toon>
      ))}
    </group>
  );
  switch (look.hairStyle) {
    case 'bald':
      return null;
    case 'bowl':
      return (
        <>
          {cap([1.1, 1.06, 1.1], 0.02, Math.PI * 0.44)}
        </>
      );
    case 'spiky':
      return (
        <>
          {cap()}
          {[
            [0, 0.4, 0, 0, 0],
            [-0.22, 0.32, 0, 0, 0.7],
            [0.22, 0.32, 0, 0, -0.7],
            [0, 0.3, -0.22, -0.7, 0],
            [-0.18, 0.22, -0.2, -0.5, 0.6],
            [0.18, 0.22, -0.2, -0.5, -0.6],
          ].map(([x, y, z, rx, rz], i) => (
            <Toon key={i} color={c} position={[x!, y!, z!]} rotation={[rx!, 0, rz!]}>
              <coneGeometry args={[0.12, 0.34, 8]} />
            </Toon>
          ))}
          {bangs}
        </>
      );
    case 'long':
      return (
        <>
          {cap()}
          <Toon color={d} position={[0, -0.28, -0.14]} scale={[1, 1, 0.55]}>
            <capsuleGeometry args={[0.34, 0.5, 6, 16]} />
          </Toon>
          {bangs}
        </>
      );
    case 'ponytail':
      return (
        <>
          {cap()}
          <Toon color={c} position={[0, 0.02, -0.46]} rotation={[0.5, 0, 0]}>
            <capsuleGeometry args={[0.1, 0.42, 6, 10]} />
          </Toon>
          {bangs}
        </>
      );
    case 'bun':
      return (
        <>
          {cap()}
          <Toon color={c} position={[0, 0.36, -0.22]}>
            <sphereGeometry args={[0.16, 16, 12]} />
          </Toon>
          {bangs}
        </>
      );
    case 'afro':
      return (
        <Toon color={c} position={[0, 0.12, -0.06]} scale={[1.25, 1.12, 1.18]}>
          <sphereGeometry args={[HEAD_R, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        </Toon>
      );
    case 'twinTails':
      return (
        <>
          {cap()}
          {[-1, 1].map((s) => (
            <Toon key={s} color={c} position={[s * 0.42, -0.1, -0.12]} rotation={[0, 0, s * 0.25]}>
              <capsuleGeometry args={[0.1, 0.46, 6, 10]} />
            </Toon>
          ))}
          {bangs}
        </>
      );
    case 'mohawk':
      return (
        <Toon color={c} position={[0, 0.32, -0.04]} scale={[0.35, 1, 1.25]}>
          <sphereGeometry args={[HEAD_R * 0.9, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </Toon>
      );
    default:
      return (
        <>
          {cap()}
          {bangs}
        </>
      );
  }
}

/** Olhos grandes de anime: íris colorida, pupila e brilho. */
function Eyes({ look, pose }: { look: HeroLook3D; pose: Pose3D }) {
  if (pose === 'fainted') {
    return (
      <>
        {[-1, 1].map((s) => (
          <Toon key={s} color={worldPalette.outline} outline={false} position={[s * 0.14, -0.02, HEAD_R - 0.02]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.018, 0.1, 4, 6]} />
          </Toon>
        ))}
      </>
    );
  }
  const happy = pose === 'victory';
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.14, -0.02, HEAD_R - 0.05]} rotation={[0, s * 0.35, 0]}>
          {happy ? (
            <Toon color={worldPalette.outline} outline={false} position={[0, 0, 0.04]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.06, 0.018, 6, 12, Math.PI]} />
            </Toon>
          ) : (
            <>
              <Toon color="#ffffff" outline={false} scale={[0.75, 1.05, 0.3]}>
                <sphereGeometry args={[0.1, 16, 12]} />
              </Toon>
              <Toon color={look.eyes} outline={false} position={[0, -0.01, 0.02]} scale={[0.6, 0.85, 0.3]}>
                <sphereGeometry args={[0.1, 16, 12]} />
              </Toon>
              <Toon color={worldPalette.outline} outline={false} position={[0, -0.01, 0.035]} scale={[0.3, 0.45, 0.2]}>
                <sphereGeometry args={[0.1, 12, 8]} />
              </Toon>
              <Toon color="#ffffff" outline={false} position={[0.02, 0.03, 0.045]} scale={[0.25, 0.25, 0.1]}>
                <sphereGeometry args={[0.1, 8, 6]} />
              </Toon>
            </>
          )}
        </group>
      ))}
      {/* Bochechas coradas */}
      {[-1, 1].map((s) => (
        <Toon key={`b${s}`} color="#f08890" outline={false} position={[s * 0.22, -0.12, HEAD_R - 0.1]} scale={[1, 0.5, 0.3]}>
          <sphereGeometry args={[0.05, 8, 6]} />
        </Toon>
      ))}
    </>
  );
}

/** Arma e acessório de cada classe. */
function ClassGear({ look }: { look: HeroLook3D }) {
  const metal = '#d8e0f0';
  switch (look.classId) {
    case 'warrior':
      return {
        hand: (
          <group rotation={[Math.PI / 2 - 0.3, 0, 0]} position={[0, 0, 0.05]}>
            <Toon color={metal} position={[0, 0.45, 0]}>
              <boxGeometry args={[0.1, 0.7, 0.03]} />
            </Toon>
            <Toon color={look.trim} position={[0, 0.08, 0]}>
              <boxGeometry args={[0.3, 0.06, 0.08]} />
            </Toon>
            <Toon color={look.leather} position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.18, 8]} />
            </Toon>
          </group>
        ),
        off: (
          <group position={[0, 0, 0.1]} rotation={[0, -0.2, 0]}>
            <Toon color={look.clothShade} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.24, 0.24, 0.05, 20]} />
            </Toon>
            <Toon color={look.trim} position={[0, 0, 0.035]}>
              <sphereGeometry args={[0.07, 10, 8]} />
            </Toon>
          </group>
        ),
        head: null,
      } as const;
    case 'mage':
      return {
        hand: (
          <group position={[0, 0.3, 0]}>
            <Toon color={look.leather}>
              <cylinderGeometry args={[0.035, 0.035, 1.3, 8]} />
            </Toon>
            <Toon color={worldPalette.glow} emissive="#806010" position={[0, 0.72, 0]}>
              <icosahedronGeometry args={[0.12, 0]} />
            </Toon>
          </group>
        ),
        off: null,
        head: (
          <group position={[0, 0.3, -0.02]} rotation={[-0.15, 0, 0.12]}>
            <Toon color={look.cloth} position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.62, 0.62, 0.04, 28]} />
            </Toon>
            <Toon color={look.cloth} position={[0, 0.34, 0]} rotation={[0.1, 0, -0.2]}>
              <coneGeometry args={[0.34, 0.7, 20]} />
            </Toon>
            <Toon color={look.trim} position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.08, 20]} />
            </Toon>
          </group>
        ),
      } as const;
    case 'rogue':
      return {
        hand: (
          <group rotation={[Math.PI / 2, 0, 0]}>
            <Toon color={metal} position={[0, 0.25, 0]}>
              <coneGeometry args={[0.06, 0.4, 4]} />
            </Toon>
            <Toon color={look.leather} position={[0, 0, 0]}>
              <boxGeometry args={[0.18, 0.05, 0.06]} />
            </Toon>
          </group>
        ),
        off: null,
        head: (
          <Toon color={look.trim} position={[0, -0.36, 0]} rotation={[0.1, 0, 0]}>
            <torusGeometry args={[0.22, 0.07, 8, 20]} />
          </Toon>
        ),
      } as const;
    case 'cleric':
      return {
        hand: (
          <group position={[0, 0.3, 0]}>
            <Toon color={look.leather}>
              <cylinderGeometry args={[0.035, 0.035, 1.2, 8]} />
            </Toon>
            <Toon color={worldPalette.glow} position={[0, 0.66, 0]}>
              <boxGeometry args={[0.07, 0.3, 0.07]} />
            </Toon>
            <Toon color={worldPalette.glow} position={[0, 0.7, 0]}>
              <boxGeometry args={[0.24, 0.07, 0.07]} />
            </Toon>
          </group>
        ),
        off: null,
        head: (
          <Toon color={worldPalette.glow} outline={false} emissive="#a08020" position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.025, 6, 24]} />
          </Toon>
        ),
      } as const;
  }
}

function Body({ look }: { look: HeroLook3D }) {
  const w = look.wide ? 1.18 : 1;
  const robe = look.build === 'robe';
  return (
    <group scale={[w, 1, w]}>
      {/* Tronco */}
      {robe ? (
        <Toon color={look.cloth} position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.2, 0.36, 0.72, 20]} />
        </Toon>
      ) : (
        <Toon color={look.cloth} position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.21, 0.26, 0.42, 20]} />
        </Toon>
      )}
      {/* Cinto */}
      <Toon color={look.leather} position={[0, robe ? 0.52 : 0.42, 0]}>
        <cylinderGeometry args={[robe ? 0.26 : 0.265, robe ? 0.26 : 0.265, 0.07, 20]} />
      </Toon>
      <Toon color={look.trim} position={[0, robe ? 0.52 : 0.42, robe ? 0.26 : 0.265]}>
        <boxGeometry args={[0.1, 0.08, 0.03]} />
      </Toon>
      {/* Ombreiras (armadura) ou gola */}
      {look.build === 'plate'
        ? [-1, 1].map((s) => (
            <Toon key={s} color={look.cloth} position={[s * 0.27, 0.8, 0]} scale={[1, 0.7, 1]}>
              <sphereGeometry args={[0.14, 14, 10]} />
            </Toon>
          ))
        : (
          <Toon color={look.trim} position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.16, 0.04, 6, 18]} />
          </Toon>
        )}
      {/* Colete: faixa aberta na frente */}
      {look.build === 'vest' && (
        <Toon color={look.sleeve} position={[0, 0.6, 0.2]} scale={[1, 1, 0.4]}>
          <boxGeometry args={[0.14, 0.38, 0.12]} />
        </Toon>
      )}
      {/* Pernas */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.11, 0, 0]}>
          {!robe && (
            <Toon color={look.pants} position={[0, 0.26, 0]}>
              <capsuleGeometry args={[0.085, 0.2, 4, 10]} />
            </Toon>
          )}
          <Toon color={look.leather} position={[0, 0.07, 0.03]} scale={[1, 0.8, 1.35]}>
            <sphereGeometry args={[0.1, 12, 8]} />
          </Toon>
        </group>
      ))}
    </group>
  );
}

export interface Hero3DProps {
  look: HeroLook3D;
  pose: Pose3D;
  still?: boolean;
}

/** Herói chibi em cel-shading, montado com as cores escolhidas na criação. */
export function Hero3D({ look, pose, still }: Hero3DProps) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const gear = ClassGear({ look });
  const w = look.wide ? 1.18 : 1;

  useFrame(({ clock }) => {
    const t = still ? 0 : clock.elapsedTime;
    const g = root.current;
    const b = body.current;
    if (!g || !b) return;
    if (pose === 'fainted') {
      g.rotation.set(-Math.PI / 2, 0, 0.3);
      g.position.y = 0.3;
      b.position.y = 0;
      armL.current?.rotation.set(0, 0, 0.3);
      armR.current?.rotation.set(0, 0, -0.3);
      return;
    }
    g.rotation.set(0, 0, 0);
    if (pose === 'victory') {
      const jump = Math.abs(Math.sin(t * 5)) * 0.35;
      g.position.y = jump;
      g.rotation.y = Math.sin(t * 2.5) * 0.25;
      b.position.y = 0;
      armR.current?.rotation.set(0, 0, -2.5);
      armL.current?.rotation.set(0, 0, 2.3 + Math.sin(t * 10) * 0.2);
      return;
    }
    // Idle: respiração e balanço leve dos braços.
    g.position.y = 0;
    b.position.y = Math.sin(t * 2.2) * 0.015;
    b.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
    armR.current?.rotation.set(Math.sin(t * 2.2) * 0.05 - 0.4, 0, -0.15);
    armL.current?.rotation.set(-Math.sin(t * 2.2) * 0.05, 0, 0.2);
  });

  return (
    <group ref={root}>
      {/* Sombra redonda no chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color={worldPalette.shadow} transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <group ref={body}>
        <Body look={look} />
        {/* Braços: pivô no ombro */}
        {[
          { ref: armR, side: -1, item: gear.hand },
          { ref: armL, side: 1, item: gear.off },
        ].map(({ ref, side, item }) => (
          <group key={side} ref={ref} position={[side * 0.3 * w, 0.78, 0]}>
            <Toon color={look.sleeve} position={[0, -0.16, 0]}>
              <capsuleGeometry args={[0.07, 0.2, 4, 10]} />
            </Toon>
            <Toon color={look.skin} position={[0, -0.34, 0]}>
              <sphereGeometry args={[0.08, 12, 8]} />
            </Toon>
            <group position={[0, -0.36, 0.02]}>{item}</group>
          </group>
        ))}
        {/* Cabeça */}
        <group position={[0, HEAD_Y, 0]}>
          <Toon color={look.skin}>
            <sphereGeometry args={[HEAD_R, 32, 24]} />
          </Toon>
          {[-1, 1].map((s) => (
            <Toon key={s} color={look.skin} position={[s * HEAD_R, -0.02, 0]} scale={[0.5, 1, 0.7]}>
              <sphereGeometry args={[0.08, 10, 8]} />
            </Toon>
          ))}
          <Eyes look={look} pose={pose} />
          <Toon color={look.skinShade} outline={false} position={[0, -0.17, HEAD_R - 0.03]} scale={[1, pose === 'victory' ? 1.4 : 0.5, 0.4]}>
            <sphereGeometry args={[0.04, 8, 6]} />
          </Toon>
          <Hair look={look} />
          {gear.head}
        </group>
      </group>
    </group>
  );
}
