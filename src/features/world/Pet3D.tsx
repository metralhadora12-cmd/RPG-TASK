import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { worldPalette } from '@/ui/palette';
import type { PetLook3D } from './look3d';
import type { Pose3D } from './Hero3D';
import { Toon } from './toon';

function Eyes({ color, y, z, gap = 0.07, closed }: { color: string; y: number; z: number; gap?: number; closed?: boolean }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <Toon
          key={s}
          color={closed ? worldPalette.outline : color}
          outline={false}
          position={[s * gap, y, z]}
          scale={closed ? [1.4, 0.25, 0.4] : [0.8, 1.1, 0.5]}
        >
          <sphereGeometry args={[0.035, 10, 8]} />
        </Toon>
      ))}
    </>
  );
}

function Cat({ look, closed }: { look: PetLook3D; closed: boolean }) {
  return (
    <>
      <Toon color={look.body} position={[0, 0.16, -0.04]} scale={[1, 0.9, 1.25]}>
        <sphereGeometry args={[0.15, 16, 12]} />
      </Toon>
      <group position={[0, 0.36, 0.06]}>
        <Toon color={look.body}>
          <sphereGeometry args={[0.15, 20, 14]} />
        </Toon>
        {[-1, 1].map((s) => (
          <Toon key={s} color={look.body} position={[s * 0.09, 0.13, 0]} rotation={[0, 0, s * -0.35]}>
            <coneGeometry args={[0.055, 0.11, 4]} />
          </Toon>
        ))}
        <Eyes color={look.eyes} y={0.01} z={0.13} gap={0.06} closed={closed} />
        <Toon color={look.accent} outline={false} position={[0, -0.04, 0.145]}>
          <sphereGeometry args={[0.018, 8, 6]} />
        </Toon>
      </group>
      <Toon color={look.shade} position={[0, 0.3, -0.24]} rotation={[-0.6, 0, 0]} name="tail">
        <capsuleGeometry args={[0.03, 0.28, 4, 8]} />
      </Toon>
    </>
  );
}

function Slime({ look, closed }: { look: PetLook3D; closed: boolean }) {
  return (
    <>
      <Toon color={look.body} position={[0, 0.16, 0]} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.2, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      </Toon>
      <Toon color={look.body} position={[0, 0.07, 0]} rotation={[Math.PI, 0, 0]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[0.2, 20, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </Toon>
      <Eyes color={look.eyes} y={0.2} z={0.16} closed={closed} />
    </>
  );
}

function Chick({ look, closed }: { look: PetLook3D; closed: boolean }) {
  return (
    <>
      <Toon color={look.body} position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.18, 20, 14]} />
      </Toon>
      <Toon color={look.accent} position={[0, 0.22, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.08, 6]} />
      </Toon>
      <Eyes color={look.eyes} y={0.28} z={0.15} closed={closed} />
    </>
  );
}

function Ghost({ look, closed }: { look: PetLook3D; closed: boolean }) {
  return (
    <group position={[0, 0.25, 0]}>
      <Toon color={look.body} position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.17, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      </Toon>
      <Toon color={look.body} position={[0, 0.03, 0]}>
        <coneGeometry args={[0.17, 0.25, 20, 1, true]} />
      </Toon>
      <Eyes color={look.eyes} y={0.13} z={0.15} closed={closed} />
    </group>
  );
}

function Dragon({ look, closed }: { look: PetLook3D; closed: boolean }) {
  return (
    <>
      <Toon color={look.body} position={[0, 0.18, 0]} scale={[1, 1, 1.2]}>
        <sphereGeometry args={[0.16, 16, 12]} />
      </Toon>
      <group position={[0, 0.4, 0.08]}>
        <Toon color={look.body}>
          <sphereGeometry args={[0.14, 16, 12]} />
        </Toon>
        {[-1, 1].map((s) => (
          <Toon key={s} color={look.accent} position={[s * 0.07, 0.13, -0.03]} rotation={[-0.3, 0, s * -0.3]}>
            <coneGeometry args={[0.03, 0.1, 6]} />
          </Toon>
        ))}
        <Eyes color={look.eyes} y={0.02} z={0.12} gap={0.06} closed={closed} />
      </group>
      {[-1, 1].map((s) => (
        <Toon key={s} color={look.shade} position={[s * 0.18, 0.3, -0.08]} rotation={[0, s * 0.4, s * -0.6]}>
          <coneGeometry args={[0.1, 0.22, 3]} />
        </Toon>
      ))}
    </>
  );
}

/** Mascote 3D que segue o herói; pula na vitória e dorme quando o herói desmaia. */
export function Pet3D({ look, pose, still }: { look: PetLook3D; pose: Pose3D; still?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const closed = pose === 'fainted';
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = still ? 0 : clock.elapsedTime;
    const tail = g.getObjectByName('tail');
    if (tail) tail.rotation.z = Math.sin(t * 4) * 0.5;
    if (pose === 'victory') {
      g.position.y = Math.abs(Math.sin(t * 6 + 1)) * 0.25;
      g.rotation.y = 0;
    } else if (closed) {
      g.position.y = 0;
      g.scale.y = 0.75 + Math.sin(t * 1.5) * 0.03;
    } else {
      g.scale.y = 1 + Math.sin(t * 3) * 0.03;
      g.position.y = look.kind === 'ghost' || look.kind === 'dragon' ? 0.15 + Math.sin(t * 2) * 0.06 : 0;
      g.rotation.y = Math.sin(t * 0.7) * 0.4;
    }
  });
  const Kind = { cat: Cat, slime: Slime, chick: Chick, ghost: Ghost, dragon: Dragon }[look.kind];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.2, 20]} />
        <meshBasicMaterial color={worldPalette.shadow} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <group ref={ref}>
        <Kind look={look} closed={closed} />
      </group>
    </group>
  );
}
