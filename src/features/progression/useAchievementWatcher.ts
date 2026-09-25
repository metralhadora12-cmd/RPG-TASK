import { useEffect } from 'react';
import { t, type MessageKey } from '@/lib/i18n';
import { emitSfx } from '@/lib/sfxBus';
import { useGameStore, type GameState } from '@/store/useGameStore';
import { showToast } from '@/ui/toastStore';
import { newlyUnlocked } from './achievements';

function check(state: GameState) {
  if (!state.hydrated || !state.character.name) return;
  const ids = newlyUnlocked(state);
  if (ids.length === 0) return;
  state.unlockAchievements(ids);
  emitSfx('achievement');
  for (const id of ids) {
    showToast({ message: t('ach.unlocked', { name: t(`ach.${id}` as MessageKey) }), duration: 6000 });
  }
}

/** Observa a store e desbloqueia conquistas assim que as condições forem atingidas. */
export function useAchievementWatcher() {
  useEffect(() => {
    check(useGameStore.getState());
    return useGameStore.subscribe(check);
  }, []);
}
