import { describe, expect, it } from 'vitest';
import type { Appearance, ClassId } from '@/store/types';
import {
  appearanceLimits,
  basePalette,
  classIds,
  classOutfits,
  eyeColors,
  hairColors,
  hairStyles,
  skinTones,
} from './characterParts';
import { characterLayers, composeCharacter, LAYER_ORDER, layDown, paintLayers, type Pose } from './compose';
import * as L from './layerData';
import { breatheRows, expandLayer, shiftRows, widenRows } from './layers';
import { derive, tone } from './palette';
import { SPRITE_SIZE } from './types';

const look = (appearance: Partial<Appearance> = {}, classId: ClassId = 'warrior') => ({
  classId,
  appearance: { body: 'a' as const, skin: 2, hairStyle: 0, hairColor: 3, eyes: 0, outfit: 2, ...appearance },
});

const ALLOWED = new Set('.abcdefghijklmnopqrstuvwxyzABCEHLMNPQSVWY'.split(''));

describe('dados das camadas', () => {
  it.each(Object.entries(L))('%s tem 64×64 e só chaves conhecidas', (_, source) => {
    const rows = expandLayer(source);
    expect(rows).toHaveLength(SPRITE_SIZE);
    for (const row of rows) {
      expect(row).toHaveLength(SPRITE_SIZE);
      for (const ch of row) expect(ALLOWED.has(ch)).toBe(true);
    }
    if (source.half) for (const row of source.half) expect(row.length).toBeLessThanOrEqual(32);
  });

  it('espelha a metade esquerda', () => {
    const rows = expandLayer({ half: ['o'] });
    expect(rows[0]).toBe('o' + '.'.repeat(62) + 'o');
    // Linhas curtas são completadas com transparência à direita.
    expect(expandLayer({ rows: ['ab'] })[0]).toBe('ab' + '.'.repeat(62));
  });

  it('opções suficientes: 10 cabelos, 12 cores, 8 peles, 6 olhos, 3 roupas por classe', () => {
    expect(hairStyles).toHaveLength(10);
    expect(hairColors).toHaveLength(12);
    expect(skinTones).toHaveLength(8);
    expect(eyeColors).toHaveLength(6);
    for (const id of classIds) expect(classOutfits[id]).toHaveLength(appearanceLimits.outfit);
  });
});

describe('paletas', () => {
  const poses: Pose[] = ['idle0', 'idle1', 'victory', 'fainted'];

  it('toda chave usada em cada camada tem cor na paleta daquela camada', () => {
    const missing = new Set<string>();
    for (const classId of classIds) {
      for (let outfit = 0; outfit < 3; outfit++) {
        for (let hairStyle = 0; hairStyle < hairStyles.length; hairStyle++) {
          for (const pose of poses) {
            for (const { layer } of characterLayers(look({ outfit, hairStyle }, classId), pose)) {
              for (const ch of new Set(layer.rows.join(''))) {
                if (ch !== '.' && !layer.palette[ch]) missing.add(`${layer.id} usa "${ch}"`);
              }
            }
          }
        }
      }
    }
    expect([...missing]).toEqual([]);
  });

  it('trocar a cor do cabelo recolore só o cabelo', () => {
    const a = composeCharacter(look({ hairColor: 0 }), 'idle0');
    const b = composeCharacter(look({ hairColor: 8 }), 'idle0');
    const changed = new Set<string>();
    a.forEach((row, y) => row.forEach((c, x) => c !== b[y]![x] && changed.add(`${c}->${b[y]![x]}`)));
    const base = derive(hairColors[0]!.palette);
    const hairFrom = [...Object.values(base), tone(base.k!, -1)]; // inclui o contorno do cabelo
    for (const pair of changed) expect(hairFrom).toContain(pair.split('->')[0]);
    expect(changed.size).toBeGreaterThan(0);
  });

  it('a pele troca junto no corpo, rosto e mãos', () => {
    const grid = composeCharacter(look({ skin: 7 }), 'idle0');
    const flat = grid.flat();
    expect(flat).toContain(skinTones[7]!.s);
    expect(flat).not.toContain(skinTones[2]!.s);
  });
});

describe('composição', () => {
  it('segue a ordem de camadas e põe equipamentos nos slots certos', () => {
    const hat = { id: 'hat', rows: expandLayer({ rows: ['o'.repeat(32)] }), palette: basePalette };
    const cape = { id: 'cape', rows: expandLayer({ rows: [] }), palette: basePalette, behind: true };
    const slots = characterLayers(look({ hairStyle: 3 }), 'idle0', { layers: { hat: [hat], accessory: [cape] } }).map(
      (l) => `${l.slot}:${l.layer.id}`,
    );
    expect(slots).toEqual([
      'back:cape',
      'hairBack:hair-back-long',
      'armBack:arm-far',
      'body:body',
      'outfit:warrior-squire',
      'face:face',
      'hairFront:hair-long',
      'hat:hat',
      'arms:arms',
    ]);
    expect(LAYER_ORDER.indexOf('hat')).toBeGreaterThan(LAYER_ORDER.indexOf('hairFront'));
    // Vista 3/4: braço de trás atrás do corpo; o da frente cobre o cabo da arma.
    expect(LAYER_ORDER.indexOf('armBack')).toBeLessThan(LAYER_ORDER.indexOf('body'));
    expect(LAYER_ORDER.indexOf('arms')).toBeGreaterThan(LAYER_ORDER.indexOf('weapon'));
  });

  it('chapéu com aba esconde o cabelo acima da linha de corte', () => {
    const spiky = look({ hairStyle: 2 });
    const top = (g: (string | null)[][]) => g.findIndex((row) => row.some(Boolean));
    const bald = top(composeCharacter(look({ hairStyle: 9 }), 'idle0'));
    expect(top(composeCharacter(spiky, 'idle0'))).toBeLessThan(bald);
    // Com o corte, o topo volta a ser o do crânio (o chapéu cobre o resto).
    expect(top(composeCharacter(spiky, 'idle0', { hairClip: 9 }))).toBe(bald);
    const layers = characterLayers(spiky, 'idle0', { hairClip: 9 });
    const hair = layers.find((l) => l.slot === 'hairFront')!.layer.rows;
    expect(hair.slice(0, 9).join('')).not.toMatch(/[^.]/);
  });

  it('camadas posteriores cobrem as anteriores', () => {
    const grid = paintLayers([
      { rows: ['s'.padEnd(32, '.')], palette: { s: '#111111' } },
      { rows: ['h'.padEnd(32, '.')], palette: { h: '#222222' } },
    ]);
    expect(grid[0]![0]).toBe('#222222');
    expect(grid[0]![1]).toBeNull();
  });

  it('idle tem 2 quadros: no segundo a cabeça desce 1px e os pés ficam', () => {
    const a = composeCharacter(look(), 'idle0');
    const b = composeCharacter(look(), 'idle1');
    const top = (g: typeof a) => g.findIndex((row) => row.some(Boolean));
    expect(top(b)).toBe(top(a) + 1);
    expect(b[50]).toEqual(a[50]);
  });

  it('vitória ergue o punho de trás ao lado da cabeça e sorri', () => {
    const idle = composeCharacter(look({ hairStyle: 9 }), 'idle0');
    const win = composeCharacter(look({ hairStyle: 9 }), 'victory');
    expect(idle[14]![45]).toBeNull();
    expect(win[14]![45]).not.toBeNull();
    expect(characterLayers(look(), 'victory').map((l) => l.layer.id)).toEqual(expect.arrayContaining(['arm-up', 'face-happy']));
  });

  it('desmaiado fica deitado e apoiado no chão, de olhos fechados', () => {
    const grid = composeCharacter(look(), 'fainted');
    const rows = grid.map((row) => row.some(Boolean));
    expect(rows[SPRITE_SIZE - 1]).toBe(true);
    const height = rows.filter(Boolean).length;
    const width = Math.max(...grid.map((row) => row.filter(Boolean).length));
    expect(width).toBeGreaterThan(height);
    const layers = characterLayers(look(), 'fainted').map((l) => l.layer.id);
    expect(layers).toContain('face-closed');
  });

  it('layDown preserva a quantidade de pixels', () => {
    const grid = composeCharacter(look(), 'idle0');
    const count = (g: typeof grid) => g.flat().filter(Boolean).length;
    expect(count(layDown(grid))).toBe(count(grid));
  });

  it('silhueta robusta alarga o tronco sem abrir o manto', () => {
    const rows = expandLayer(L.outfitRobe);
    const wide = widenRows(rows);
    const width = (r: string) => r.replace(/^\.+|\.+$/g, '').length;
    expect(width(wide[40]!)).toBe(width(rows[40]!) + 4);
    expect(width(wide[27]!)).toBe(width(rows[27]!) + 2); // ombro alarga em degrau suave
    expect(wide[10]).toBe(rows[10]); // cabeça não muda
    // Barra do manto continua inteira (sem vão no meio).
    expect(wide[57]!.slice(20, 44)).not.toContain('.');
    // Calças da túnica: pernas afastadas com vão transparente maior.
    const tunic = widenRows(expandLayer(L.outfitTunic));
    expect(tunic[50]!.slice(30, 34)).toBe('....');
  });

  it('na silhueta robusta os braços deslizam com os ombros (sem entortar)', () => {
    const near = expandLayer(L.armsTunicNear);
    expect(shiftRows(near, -2)[42]).toBe(near[42]!.slice(2) + '..');
    expect(shiftRows(near, 3)[42]).toBe('...' + near[42]!.slice(0, 61));
    const plain = composeCharacter(look(), 'victory');
    const wide = composeCharacter(look({ body: 'b' }), 'victory');
    // O punho erguido (acima dos ombros) anda 2px para a direita junto com o braço.
    expect(wide[14]![47]).toBe(plain[14]![45]);
  });

  it('breatheRows mantém o tamanho e desce o topo', () => {
    const rows = expandLayer(L.body);
    const out = breatheRows(rows);
    expect(out).toHaveLength(64);
    expect(out[5]).toBe(rows[4]);
    expect(out[50]).toBe(rows[50]);
  });
});
