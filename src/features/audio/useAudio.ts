import { useEffect } from 'react';
import { setSfxHandler } from '@/lib/sfxBus';
import { useGameStore } from '@/store/useGameStore';
import { playSfx, unlockAudio } from './synth';

/** Liga o barramento de efeitos ao sintetizador, respeitando som/volume das configurações. */
export function useAudio() {
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    const remove = setSfxHandler((name) => {
      const { soundEnabled, volume } = useGameStore.getState().settings;
      if (soundEnabled) playSfx(name, volume);
    });
    return () => {
      remove();
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
    };
  }, []);
}
