import { afterEach, describe, expect, it, vi } from 'vitest';
import { emitSfx, setSfxHandler, type SfxName } from '@/lib/sfxBus';
import { playSfx, SFX, sfxDuration } from './synth';

describe('sfxBus', () => {
  afterEach(() => setSfxHandler(null));

  it('entrega o nome ao handler registrado e para após remover', () => {
    const fn = vi.fn();
    const remove = setSfxHandler(fn);
    emitSfx('coins');
    expect(fn).toHaveBeenCalledWith('coins');
    remove();
    emitSfx('coins');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('sintetizador', () => {
  it('todos os efeitos têm notas válidas; o level up dura ~2s', () => {
    for (const [name, notes] of Object.entries(SFX)) {
      expect(notes.length, name).toBeGreaterThan(0);
      for (const n of notes) {
        expect(n.dur).toBeGreaterThan(0);
        if (n.wave !== 'noise') expect(n.freq).toBeGreaterThan(20);
      }
    }
    expect(sfxDuration('levelUp')).toBeGreaterThan(1.5);
    expect(sfxDuration('levelUp')).toBeLessThan(2.6);
    expect(sfxDuration('cursor')).toBeLessThan(0.1);
  });

  it('agenda osciladores no Web Audio', () => {
    const started: string[] = [];
    const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
    class FakeContext {
      state = 'running';
      currentTime = 0;
      sampleRate = 8000;
      destination = {};
      createGain = () => ({ gain: param(), connect: vi.fn() });
      createOscillator = () => {
        const osc = { type: '', frequency: param(), connect: vi.fn(), start: () => started.push(osc.type), stop: vi.fn() };
        return osc;
      };
      createBuffer = () => ({ getChannelData: () => new Float32Array(10) });
      createBufferSource = () => ({ buffer: null, connect: vi.fn(), start: () => started.push('noise'), stop: vi.fn() });
      resume = vi.fn();
    }
    vi.stubGlobal('AudioContext', FakeContext);
    playSfx('damage' as SfxName, 1);
    expect(started).toEqual(['noise', 'square']);
    vi.unstubAllGlobals();
  });
});
