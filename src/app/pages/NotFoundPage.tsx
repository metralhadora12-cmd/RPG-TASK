import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { Window } from '@/ui/Window';

export function NotFoundPage() {
  return (
    <Window title={t('page.notFound.title')}>
      <p className="text-shadow-pixel">{t('page.notFound.body')}</p>
      <Link to="/missoes" className="mt-3 inline-block text-win-accent underline">
        {t('page.notFound.back')}
      </Link>
    </Window>
  );
}
