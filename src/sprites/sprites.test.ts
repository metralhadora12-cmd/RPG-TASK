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
import { breatheRows, expandLayer, widenRows } from './layers';
import { SPRITE_SIZE } from './types';

const look = (appearance: Partial<Appearance> = {}, classId: ClassId = 'warrior') => ({
  classId,
  appearance: { body: 'a' as const, skin: 2, hairStyle: 0, hairColor: 3, eyes: 0, outfit: 2, ...appearance },
});

const ALLOWED = new Set('.oswrSehHlcCaApPbBmMvV'.split(''));

describe('dados das camadas', () => {
  it.each(Object.entries(L))('%s tem 32×32 e só chaves conhecidas', (_, source) => {
    const rows = expandLayer(source);
    expect(rows).toHaveLength(SPRITE_SIZE);
    for (const row of rows) {
      expect(row).toHaveLength(SPRITE_SIZE);
      for (const ch of row) expect(ALLOWED.has(ch)).toBe(true);
    }
    if (source.half) for (const row of source.half) expect(row).toHaveLength(16);
  });

  it('espelha a metade esquerda', () => {
    const rows = expandLayer({ half: ['o'.padEnd(16, '.')] });
    expect(rows[0]).toBe('o' + '.'.repeat(30) + 'o');
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
    for (const classId of classIds) {
      for (let outfit = 0; outfit < 3; outfit++) {
        for (let hairStyle = 0; hairStyle < hairStyles.length; hairStyle++) {
          for (const pose of poses) {
            for (const { layer } of characterLayers(look({ outfit, hairStyle }, classId), pose)) {
              for (const row of layer.rows)
                for (const ch of row) if (ch !== '.') expect(layer.palette[ch], `${layer.id} usa "${ch}"`).toBeDefined();
            }
          }
        }
      }
    }
  });

  it('trocar a cor do cabelo recolore só o cabelo', () => {
    const a = composeCharacter(look({ hairColor: 0 }), 'idle0');
    const b = composeCharacter(look({ hairColor: 8 }), 'idle0');
    const changed = new Set<string>();
    a.forEach((row, y) => row.forEach((c, x) => c !== b[y]![x] && changed.add(`${c}->${b[y]![x]}`)));
    const hairFrom = Object.values(hairColors[0]!.palette);
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
    const slots = characterLayers(look({ hairStyle: 3 }), 'idle0', { hat: [hat], accessory: [cape] }).map(
      (l) => `${l.slot}:${l.layer.id}`,
    );
    expect(slots).toEqual([
      'back:cape',
      'hairBack:hair-back-long',
      'body:body',
      'outfit:warrior-squire',
      'face:face',
      'hairFront:hair-long',
      'hat:hat',
      'arms:arms',
    ]);
    expect(LAYER_ORDER.indexOf('hat')).toBeGreaterThan(LAYER_ORDER.indexOf('hairFront'));
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
    expect(b[30]).toEqual(a[30]);
  });

  it('vitória levanta o braço acima dos ombros', () => {
    const idle = composeCharacter(look({ hairStyle: 9 }), 'idle0');
    const win = composeCharacter(look({ hairStyle: 9 }), 'victory');
    expect(idle[6]![28]).toBeNull();
    expect(win[6]![28]).not.toBeNull();
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
    expect(width(wide[20]!)).toBe(width(rows[20]!) + 2);
    // Barra do manto continua inteira (sem vão no meio).
    expect(wide[28]!.slice(8, 24)).not.toContain('.');
    // Calças da túnica: pernas afastadas com vão transparente.
    const tunic = widenRows(expandLayer(L.outfitTunic));
    expect(tunic[26]!.slice(15, 17)).toBe('..');
  });

  it('breatheRows mantém o tamanho e desce o topo', () => {
    const rows = expandLayer(L.body);
    const out = breatheRows(rows);
    expect(out).toHaveLength(32);
    expect(out[5]).toBe(rows[4]);
    expect(out[25]).toBe(rows[25]);
  });
});
