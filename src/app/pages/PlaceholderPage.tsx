import type { MessageKey } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { Window } from '@/ui/Window';

export function PlaceholderPage({ title, intro, phase }: { title: MessageKey; intro: MessageKey; phase: number }) {
  return (
    <Window title={t(title)}>
      <p className="text-shadow-pixel">{t(intro)}</p>
      <p className="mt-2 text-win-dim">{t('common.comingSoon', { phase })}</p>
    </Window>
  );
}
