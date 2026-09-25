import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import { Window } from '@/ui/Window';
import { useAudio } from '@/features/audio/useAudio';
import { createAppRouter } from './router';
import { SettingsEffects } from './SettingsEffects';

export function App() {
  const hydrated = useGameStore((s) => s.hydrated);
  const router = useMemo(createAppRouter, []);
  useAudio();
  return (
    <>
      <SettingsEffects />
      {hydrated ? (
        <RouterProvider router={router} />
      ) : (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Window>
            <p className="font-title text-xs" role="status">
              {t('common.loading')}
            </p>
          </Window>
        </div>
      )}
    </>
  );
}
