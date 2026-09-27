import type { MessageKey } from '@/lib/i18n';

export type PlaceId = 'board' | 'shop' | 'house' | 'tower' | 'arena';
export type Vec3 = [number, number, number];

export interface Place {
  id: PlaceId;
  label: MessageKey;
  /** Posição do prédio na vila. */
  position: Vec3;
  /** Rotação em Y (o prédio olha para a praça). */
  facing: number;
  /** Câmera ao visitar o local: onde fica e para onde olha. */
  camera: Vec3;
  target: Vec3;
  /** Tela do app aberta ao entrar (o quadro de missões e a arena ficam na própria cena). */
  route?: string;
}

/** Vila: quadro de missões no centro, cercado pelos prédios das outras seções. */
export const PLACES: Place[] = [
  { id: 'board', label: 'world.board', position: [0, 0, -1.6], facing: 0, camera: [0.9, 2.9, 4.9], target: [0.45, 1.2, -1.0], route: '/missoes' },
  { id: 'shop', label: 'world.shop', position: [-5.2, 0, -2.2], facing: 0.7, camera: [-2.4, 3.2, 2.2], target: [-5.2, 1.2, -2.2], route: '/loja' },
  { id: 'house', label: 'world.house', position: [5.2, 0, -2.2], facing: -0.7, camera: [2.4, 3.2, 2.2], target: [5.2, 1.2, -2.2], route: '/personagem' },
  { id: 'arena', label: 'world.arena', position: [-4.2, 0, 3.6], facing: 0.9, camera: [-0.6, 3.4, 7.8], target: [-4.2, 1, 3.6] },
  { id: 'tower', label: 'world.tower', position: [4.6, 0, 3.4], facing: -0.9, camera: [1.2, 3.8, 7.8], target: [4.6, 1.6, 3.4], route: '/menu' },
];

/** Visão geral da vila (câmera inicial). */
export const OVERVIEW = { camera: [0, 9.5, 12.5] as Vec3, target: [0, 0.6, 0] as Vec3 };

export function getPlace(id: PlaceId): Place {
  return PLACES.find((p) => p.id === id)!;
}

/** Interpolação suave da câmera (fator por quadro independente da taxa de quadros). */
export function dampFactor(lambda: number, dt: number): number {
  return 1 - Math.exp(-lambda * dt);
}
