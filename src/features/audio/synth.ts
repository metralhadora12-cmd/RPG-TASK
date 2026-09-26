import type { SfxName } from '@/lib/sfxBus';

/**
 * Sintetizador chiptune procedural (Web Audio): ondas quadrada, triangular e
 * ruído. Nenhum arquivo de áudio é usado.
 */

type Wave = 'square' | 'triangle' | 'sawtooth' | 'noise';

interface Note {
  wave: Wave;
  /** Frequência em Hz (ignorada no ruído). */
  freq: number;
  /** Frequência final (glissando). */
  to?: number;
  /** Início relativo (s). */
  at: number;
  dur: number;
  vol?: number;
}

const N: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, E6: 1318.51, G6: 1567.98,
};

const seq = (wave: Wave, notes: [string, number][], step: number, vol = 0.5, start = 0): Note[] =>
  notes.map(([n, len], i) => ({
    wave,
    freq: N[n]!,
    at: start + notes.slice(0, i).reduce((s, [, l]) => s + l, 0) * step,
    dur: len * step * 0.9,
    vol,
  }));

/** Partituras de cada efeito. */
export const SFX: Record<SfxName, Note[]> = {
  cursor: [{ wave: 'square', freq: 1320, at: 0, dur: 0.025, vol: 0.25 }],
  confirm: [
    { wave: 'square', freq: N.E5!, at: 0, dur: 0.05, vol: 0.35 },
    { wave: 'square', freq: N.A5!, at: 0.05, dur: 0.08, vol: 0.35 },
  ],
  cancel: [{ wave: 'square', freq: N.A4!, to: N.C4!, at: 0, dur: 0.12, vol: 0.3 }],
  complete: seq('triangle', [['C5', 1], ['E5', 1], ['G5', 1], ['C6', 2]], 0.055, 0.7),
  coins: [
    { wave: 'square', freq: N.B5!, at: 0, dur: 0.06, vol: 0.3 },
    { wave: 'square', freq: N.E6!, at: 0.06, dur: 0.22, vol: 0.3 },
  ],
  purchase: [
    { wave: 'square', freq: N.B5!, at: 0, dur: 0.06, vol: 0.3 },
    { wave: 'square', freq: N.E6!, at: 0.06, dur: 0.12, vol: 0.3 },
    { wave: 'square', freq: N.B5!, at: 0.2, dur: 0.06, vol: 0.3 },
    { wave: 'square', freq: N.G6!, at: 0.26, dur: 0.25, vol: 0.3 },
  ],
  damage: [
    { wave: 'noise', freq: 0, at: 0, dur: 0.14, vol: 0.5 },
    { wave: 'square', freq: 180, to: 70, at: 0, dur: 0.18, vol: 0.3 },
  ],
  heal: seq('triangle', [['C5', 1], ['E5', 1], ['G5', 1], ['E6', 2]], 0.07, 0.6),
  achievement: [
    ...seq('square', [['G5', 1], ['C6', 1], ['E6', 1], ['G6', 3]], 0.08, 0.3),
    ...seq('triangle', [['C4', 3], ['G4', 3]], 0.08, 0.6),
  ],
  levelUp: [
    // Fanfarra de ~2s: melodia em quadrada + baixo em triangular.
    ...seq('square', [['C5', 1], ['C5', 1], ['C5', 1], ['C5', 3], ['A4', 3], ['B4', 3], ['C5', 2], ['B4', 1], ['C5', 6]], 0.095, 0.3),
    ...seq('triangle', [['C4', 6], ['F4', 3], ['G4', 3], ['C4', 9]], 0.095, 0.7),
  ],
  faint: seq('triangle', [['G4', 2], ['F4', 2], ['E4', 2], ['D4', 2], ['C4', 6]], 0.12, 0.6),
};

/** Duração total (s) de um efeito. */
export function sfxDuration(name: SfxName): number {
  return Math.max(...SFX[name].map((n) => n.at + n.dur));
}

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Navegadores só liberam áudio depois de uma interação do usuário. */
export function unlockAudio(): void {
  const c = getContext();
  if (c && c.state === 'suspended') void c.resume();
}

function noise(c: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  noiseBuffer = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

/** Toca um efeito com o volume dado (0–1). Não faz nada sem Web Audio. */
export function playSfx(name: SfxName, volume: number): void {
  const c = getContext();
  if (!c || c.state !== 'running' || volume <= 0) return;
  const master = c.createGain();
  master.gain.value = Math.min(1, volume) * 0.35;
  master.connect(c.destination);
  const t0 = c.currentTime + 0.005;
  for (const note of SFX[name]) {
    const gain = c.createGain();
    const start = t0 + note.at;
    const end = start + note.dur;
    gain.gain.setValueAtTime(note.vol ?? 0.5, start);
    // Decaimento curto no fim de cada nota, como nos chips de 16 bits.
    gain.gain.linearRampToValueAtTime(0.0001, end);
    gain.connect(master);
    if (note.wave === 'noise') {
      const src = c.createBufferSource();
      src.buffer = noise(c);
      src.connect(gain);
      src.start(start);
      src.stop(end);
    } else {
      const osc = c.createOscillator();
      osc.type = note.wave;
      osc.frequency.setValueAtTime(note.freq, start);
      if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, end);
      osc.connect(gain);
      osc.start(start);
      osc.stop(end + 0.01);
    }
  }
}
