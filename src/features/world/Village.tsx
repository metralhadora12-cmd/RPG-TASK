import { useCursor } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useMemo, useState, type ReactNode } from 'react';
import { worldPalette as W } from '@/ui/palette';
import { PLACES, type Place, type PlaceId } from './places';
import { Toon } from './toon';

/** Pseudoaleatório determinístico (a vila é igual em todo carregamento). */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Toon color={W.trunk} position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.7, 8]} />
      </Toon>
      <Toon color={W.leaf} position={[0, 0.95, 0]}>
        <coneGeometry args={[0.6, 0.9, 8]} />
      </Toon>
      <Toon color={W.leafLight} position={[0, 1.45, 0]}>
        <coneGeometry args={[0.44, 0.7, 8]} />
      </Toon>
    </group>
  );
}

function Bush({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[
        [0, 0.18, 0, 0.25],
        [0.22, 0.14, 0.05, 0.18],
        [-0.2, 0.13, 0.02, 0.17],
      ].map(([x, y, z, r], i) => (
        <Toon key={i} color={i ? W.leafLight : W.leaf} position={[x!, y!, z!]}>
          <sphereGeometry args={[r!, 12, 8]} />
        </Toon>
      ))}
    </group>
  );
}

function Roof({ color, width, depth, y }: { color: string; width: number; depth: number; y: number }) {
  return (
    <Toon color={color} position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]} scale={[width, 1, depth]}>
      <coneGeometry args={[0.75, 0.9, 4]} />
    </Toon>
  );
}

function Door({ z, color = W.woodDark }: { z: number; color?: string }) {
  return (
    <Toon color={color} position={[0, 0.4, z]}>
      <boxGeometry args={[0.4, 0.8, 0.05]} />
    </Toon>
  );
}

function Window3D({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <Toon color={W.glow} emissive="#403000" position={[x, y, z]}>
      <boxGeometry args={[0.28, 0.28, 0.04]} />
    </Toon>
  );
}

function Shop() {
  return (
    <>
      <Toon color={W.wall} position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 1.4, 1.4]} />
      </Toon>
      <Roof color={W.roofRed} width={1.8} depth={1.4} y={1.85} />
      <Door z={0.71} />
      <Window3D x={-0.55} y={0.85} z={0.71} />
      <Window3D x={0.55} y={0.85} z={0.71} />
      {/* Toldo listrado */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <Toon key={x} color={i % 2 ? W.wall : W.roofRed} position={[x, 1.25, 0.88]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.4, 0.05, 0.45]} />
        </Toon>
      ))}
      {/* Placa com moeda */}
      <Toon color={W.glow} position={[0, 1.55, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
      </Toon>
      {/* Barril e caixote */}
      <Toon color={W.wood} position={[1.1, 0.25, 0.6]}>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 12]} />
      </Toon>
      <Toon color={W.woodDark} position={[-1.1, 0.2, 0.6]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
      </Toon>
    </>
  );
}

function House() {
  return (
    <>
      <Toon color={W.wall} position={[0, 0.65, 0]}>
        <boxGeometry args={[1.6, 1.3, 1.3]} />
      </Toon>
      <Roof color={W.roofBlue} width={1.6} depth={1.3} y={1.75} />
      <Toon color={W.stoneDark} position={[0.45, 2.0, -0.2]}>
        <boxGeometry args={[0.22, 0.6, 0.22]} />
      </Toon>
      <Door z={0.66} />
      <Window3D x={-0.5} y={0.8} z={0.66} />
      <Window3D x={0.5} y={0.8} z={0.66} />
      {/* Canteiro de flores */}
      {[-0.55, -0.35, 0.35, 0.55].map((x) => (
        <Toon key={x} color={x < 0 ? '#f878b0' : '#f8e070'} position={[x, 0.1, 0.85]}>
          <sphereGeometry args={[0.08, 8, 6]} />
        </Toon>
      ))}
    </>
  );
}

function Tower() {
  return (
    <>
      <Toon color={W.stone} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.6, 0.75, 2.4, 12]} />
      </Toon>
      <Toon color={W.roofPurple} position={[0, 2.95, 0]}>
        <coneGeometry args={[0.9, 1.2, 12]} />
      </Toon>
      <Toon color={W.glow} emissive="#806000" position={[0, 3.7, 0]}>
        <octahedronGeometry args={[0.16, 0]} />
      </Toon>
      <Door z={0.72} />
      <Window3D x={0} y={1.7} z={0.64} />
    </>
  );
}

function Arena() {
  const stones = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  return (
    <>
      <Toon color={W.stone} position={[0, 0.06, 0]} outline={false}>
        <cylinderGeometry args={[1.6, 1.7, 0.12, 32]} />
      </Toon>
      {stones.map((a, i) =>
        // A frente fica aberta para a praça.
        a > Math.PI * 0.3 && a < Math.PI * 0.7 ? null : (
          <Toon key={i} color={i % 2 ? W.stone : W.stoneDark} position={[Math.cos(a) * 1.75, 0.3, Math.sin(a) * 1.75]}>
            <boxGeometry args={[0.35, 0.6, 0.35]} />
          </Toon>
        ),
      )}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.2, 0, 1.4]}>
          <Toon color={W.woodDark} position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 1, 6]} />
          </Toon>
          <Toon color="#f89020" emissive="#c04000" outline={false} position={[0, 1.08, 0]} name="flame">
            <coneGeometry args={[0.1, 0.25, 8]} />
          </Toon>
        </group>
      ))}
    </>
  );
}

function BoardFrame() {
  return (
    <>
      {[-1, 1].map((s) => (
        <Toon key={s} color={W.woodDark} position={[s * 1.15, 1.0, 0]}>
          <boxGeometry args={[0.14, 2.0, 0.14]} />
        </Toon>
      ))}
      <Toon color={W.wood} position={[0, 1.45, -0.02]}>
        <boxGeometry args={[2.2, 1.5, 0.08]} />
      </Toon>
      <Toon color={W.roofRed} position={[0, 2.3, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1.4, 1]}>
        <cylinderGeometry args={[0.18, 0.18, 1.8, 3]} />
      </Toon>
    </>
  );
}

const ART: Record<PlaceId, () => ReactNode> = { board: BoardFrame, shop: Shop, house: House, tower: Tower, arena: Arena };

function Building({ place, onSelect, children }: { place: Place; onSelect: (id: PlaceId) => void; children?: ReactNode }) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const Art = ART[place.id];
  const stop = (fn: () => void) => (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    e.stopPropagation();
    fn();
  };
  return (
    <group position={place.position} rotation={[0, place.facing, 0]}>
      <group
        scale={hover ? 1.03 : 1}
        onPointerOver={stop(() => setHover(true))}
        onPointerOut={stop(() => setHover(false))}
        onClick={stop(() => onSelect(place.id))}
      >
        <Art />
      </group>
      {children}
    </group>
  );
}

function Island() {
  const decor = useMemo(() => {
    const r = rng(7);
    const trees: { p: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + r() * 0.2;
      const d = 8.2 + r() * 1.2;
      trees.push({ p: [Math.cos(a) * d, 0, Math.sin(a) * d], s: 0.8 + r() * 0.6 });
    }
    const bushes: [number, number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const a = r() * Math.PI * 2;
      const d = 6.5 + r() * 1.2;
      bushes.push([Math.cos(a) * d, 0, Math.sin(a) * d]);
    }
    return { trees, bushes };
  }, []);
  return (
    <>
      <Toon color={W.grass} position={[0, -0.15, 0]} outline={false}>
        <cylinderGeometry args={[10, 10, 0.3, 48]} />
      </Toon>
      <Toon color={W.dirt} position={[0, -1.1, 0]} outline={false}>
        <cylinderGeometry args={[10, 7, 1.6, 48]} />
      </Toon>
      <Toon color={W.dirtDark} position={[0, -2.4, 0]} outline={false}>
        <coneGeometry args={[7, 2.2, 24]} />
      </Toon>
      {/* Praça e caminhos até cada prédio */}
      <Toon color={W.path} position={[0, 0.01, 0.4]} outline={false}>
        <cylinderGeometry args={[2.4, 2.4, 0.02, 40]} />
      </Toon>
      {PLACES.filter((p) => p.id !== 'board').map((p) => {
        const [x, , z] = p.position;
        const len = Math.hypot(x, z - 0.4);
        return (
          <Toon
            key={p.id}
            color={W.path}
            outline={false}
            position={[x / 2, 0.012, (z + 0.4) / 2]}
            rotation={[0, Math.atan2(x, z - 0.4), 0]}
          >
            <boxGeometry args={[0.9, 0.02, len]} />
          </Toon>
        );
      })}
      {decor.trees.map((t, i) => (
        <Tree key={i} position={t.p} scale={t.s} />
      ))}
      {decor.bushes.map((p, i) => (
        <Bush key={i} position={p} />
      ))}
    </>
  );
}

export interface VillageProps {
  onSelect: (id: PlaceId) => void;
  /** Conteúdo extra preso a um prédio (quadro de missões, chefe na arena). */
  attachments?: Partial<Record<PlaceId, ReactNode>>;
}

/** A vila: ilha flutuante com os prédios de cada seção do app. */
export function Village({ onSelect, attachments = {} }: VillageProps) {
  return (
    <>
      <Island />
      {PLACES.map((p) => (
        <Building key={p.id} place={p} onSelect={onSelect}>
          {attachments[p.id]}
        </Building>
      ))}
    </>
  );
}
