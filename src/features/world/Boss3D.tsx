import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { worldPalette } from '@/ui/palette';
import type { BossId } from '@/features/boss/boss';
import { Toon } from './toon';

const DEMON = { body: '#c83838', shade: '#801c24', horn: '#f0e8d0', eye: '#f8e040', wing: '#502040', metal: '#d8e0f0' };
const BLOOD = { body: '#a01828', shade: '#600c18', eye: '#f8f0e0', iris: '#201018' };

function Demon() {
  return (
    <>
      {/* Pernas e corpo */}
      {[-1, 1].map((s) => (
        <Toon key={s} color={DEMON.shade} position={[s * 0.25, 0.35, 0]}>
          <capsuleGeometry args={[0.14, 0.4, 4, 10]} />
        </Toon>
      ))}
      <Toon color={DEMON.body} position={[0, 1.05, 0]} scale={[1, 1.1, 0.8]}>
        <sphereGeometry args={[0.5, 24, 16]} />
      </Toon>
      {/* Asas */}
      {[-1, 1].map((s) => (
        <group key={s} name={s < 0 ? 'wingL' : 'wingR'} position={[s * 0.35, 1.3, -0.35]}>
          <Toon color={DEMON.wing} position={[s * 0.45, 0.15, 0]} rotation={[0, 0, s * -0.9]} scale={[1, 1, 0.08]}>
            <coneGeometry args={[0.45, 1, 3]} />
          </Toon>
        </group>
      ))}
      {/* Cabeça com chifres */}
      <group position={[0, 1.8, 0.05]}>
        <Toon color={DEMON.body}>
          <sphereGeometry args={[0.36, 24, 16]} />
        </Toon>
        {[-1, 1].map((s) => (
          <Toon key={s} color={DEMON.horn} position={[s * 0.25, 0.3, 0]} rotation={[0, 0, s * -0.5]}>
            <coneGeometry args={[0.08, 0.36, 10]} />
          </Toon>
        ))}
        {[-1, 1].map((s) => (
          <Toon key={`e${s}`} color={DEMON.eye} emissive="#806000" outline={false} position={[s * 0.13, 0.03, 0.32]} rotation={[0, 0, s * 0.35]} scale={[1.2, 0.55, 0.4]}>
            <sphereGeometry args={[0.07, 10, 8]} />
          </Toon>
        ))}
        {[-1, 1].map((s) => (
          <Toon key={`f${s}`} color={DEMON.horn} outline={false} position={[s * 0.08, -0.17, 0.3]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.03, 0.08, 4]} />
          </Toon>
        ))}
      </group>
      {/* Braço com cimitarra */}
      <group name="weaponArm" position={[0.55, 1.25, 0.05]}>
        <Toon color={DEMON.body} position={[0.1, -0.2, 0]} rotation={[0, 0, 0.4]}>
          <capsuleGeometry args={[0.1, 0.35, 4, 10]} />
        </Toon>
        <Toon color={DEMON.metal} position={[0.3, 0.25, 0.1]} rotation={[0, 0, -0.3]} scale={[1, 1, 0.12]}>
          <cylinderGeometry args={[0.1, 0.02, 1, 3]} />
        </Toon>
      </group>
      <Toon color={DEMON.body} position={[-0.6, 1.0, 0.05]} rotation={[0, 0, -0.4]}>
        <capsuleGeometry args={[0.1, 0.35, 4, 10]} />
      </Toon>
    </>
  );
}

function BloodMonster() {
  return (
    <>
      <Toon color={BLOOD.body} position={[0, 0.7, 0]} scale={[1.2, 1, 1.1]}>
        <sphereGeometry args={[0.7, 28, 20]} />
      </Toon>
      {/* Gotas escorrendo */}
      {[
        [-0.6, 0.18, 0.3, 0.2],
        [0.55, 0.15, 0.35, 0.18],
        [0.1, 0.12, 0.62, 0.15],
        [-0.25, 0.1, -0.55, 0.16],
      ].map(([x, y, z, r], i) => (
        <Toon key={i} color={BLOOD.shade} position={[x!, y!, z!]}>
          <sphereGeometry args={[r!, 12, 10]} />
        </Toon>
      ))}
      {/* Olho único */}
      <group position={[0, 0.95, 0.62]}>
        <Toon color={BLOOD.eye} scale={[1, 1, 0.5]}>
          <sphereGeometry args={[0.24, 20, 14]} />
        </Toon>
        <Toon color={BLOOD.iris} outline={false} position={[0, 0, 0.1]} scale={[0.5, 1, 0.3]}>
          <sphereGeometry args={[0.16, 12, 10]} />
        </Toon>
      </group>
      {/* Boca */}
      <Toon color={BLOOD.iris} outline={false} position={[0, 0.5, 0.75]} scale={[1.6, 0.4, 0.3]}>
        <sphereGeometry args={[0.12, 12, 8]} />
      </Toon>
    </>
  );
}

export interface Boss3DProps {
  bossId: BossId;
  /** Dano acumulado: quando aumenta, o chefe pisca e recua. */
  damage: number;
  defeated: boolean;
  still?: boolean;
}

/** Chefe da semana em 3D: respira, pisca em vermelho ao levar dano e desaba quando derrotado. */
export function Boss3D({ bossId, damage, defeated, still }: Boss3DProps) {
  const ref = useRef<THREE.Group>(null);
  const hurtUntil = useRef(0);
  const lastDamage = useRef(damage);
  const clockRef = useRef(0);

  useEffect(() => {
    if (damage > lastDamage.current) hurtUntil.current = clockRef.current + 0.6;
    lastDamage.current = damage;
  }, [damage]);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    clockRef.current = clock.elapsedTime;
    const t = still ? 0 : clock.elapsedTime;
    const hurt = clock.elapsedTime < hurtUntil.current;
    g.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshToonMaterial) {
        o.material.emissive.set(hurt && Math.floor(clock.elapsedTime * 16) % 2 === 0 ? worldPalette.hurt : '#000000');
      }
    });
    if (defeated) {
      g.rotation.set(-Math.PI / 2 + 0.2, 0, 0);
      g.position.set(0, 0.3, 0);
      return;
    }
    g.rotation.set(0, Math.sin(t * 0.8) * 0.15, 0);
    g.position.set(hurt ? Math.sin(clock.elapsedTime * 60) * 0.06 : 0, 0, hurt ? -0.15 : 0);
    g.scale.set(1, 1 + Math.sin(t * 1.8) * 0.03, 1);
    const wingL = g.getObjectByName('wingL');
    const wingR = g.getObjectByName('wingR');
    if (wingL) wingL.rotation.y = Math.sin(t * 3) * 0.3;
    if (wingR) wingR.rotation.y = -Math.sin(t * 3) * 0.3;
    const arm = g.getObjectByName('weaponArm');
    if (arm) arm.rotation.z = Math.sin(t * 1.4) * 0.15;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.8, 28]} />
        <meshBasicMaterial color={worldPalette.shadow} transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <group ref={ref}>{bossId === 'demon' ? <Demon /> : <BloodMonster />}</group>
    </group>
  );
}
