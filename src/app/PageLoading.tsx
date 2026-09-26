import { t } from '@/lib/i18n';
import { Window } from '@/ui/Window';

export function PageLoading() {
  return (
    <Window>
      <p className="font-title text-xs" role="status">
        {t('common.loading')}
      </p>
    </Window>
  );
}
