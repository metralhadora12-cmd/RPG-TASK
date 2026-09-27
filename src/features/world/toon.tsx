import { Outlines } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { forwardRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { worldPalette } from '@/ui/palette';

let gradient: THREE.DataTexture | null = null;

/** Rampa de 3 tons (sombra · meio-tom · luz) do cel-shading, sem interpolação. */
export function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  gradient = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

type MeshProps = Omit<ThreeElements['mesh'], 'children'>;

export interface ToonProps extends MeshProps {
  color: string;
  /** Geometria (ex.: `<sphereGeometry args={[1, 24, 16]} />`). */
  children: ReactNode;
  /** Contorno de tinta (casco invertido). */
  outline?: boolean;
  /** Espessura do contorno em pixels de tela (constante a qualquer distância). */
  outlineWidth?: number;
  emissive?: string;
  side?: THREE.Side;
}

/** Malha com material toon e contorno escuro, o bloco básico do mundo. */
export const Toon = forwardRef<THREE.Mesh, ToonProps>(function Toon(
  { color, children, outline = true, outlineWidth = 2.2, emissive, side, ...mesh },
  ref,
) {
  return (
    <mesh ref={ref} castShadow receiveShadow {...mesh}>
      {children}
      <meshToonMaterial color={color} gradientMap={toonGradient()} emissive={emissive ?? '#000000'} side={side} />
      {outline && <Outlines thickness={outlineWidth} color={worldPalette.outline} />}
    </mesh>
  );
});
