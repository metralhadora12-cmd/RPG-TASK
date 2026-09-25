import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { t } from '@/lib/i18n';
import { CursorSlot } from '@/ui/Cursor';
import { PixelIcon } from '@/ui/PixelIcon';
import { useMenuNavigation } from '@/ui/useMenuNavigation';
import { Window } from '@/ui/Window';
import { ListsPanel } from '@/features/tasks/components/ListsPanel';
import { useReminders } from '@/features/tasks/useReminders';
import { Toasts } from '@/ui/Toasts';
import { FloatingNumbers } from '@/features/progression/FloatingNumbers';
import { LevelUpOverlay } from '@/features/progression/LevelUpOverlay';
import { DamageFx, GameOverOverlay, NightReportDialog, useDayCycle } from '@/features/progression/DayOverlays';
import { useMediaQuery } from '@/ui/useMediaQuery';
import { Hud } from './Hud';
import { mainNav } from './navigation';
import { navIcons } from './navIcons';

function activeNavIndex(pathname: string) {
  return Math.max(0, mainNav.findIndex((n) => pathname.startsWith(n.to)));
}

/** Barra lateral (desktop) com cursor de mãozinha e navegação por setas. */
function Sidebar() {
  const { pathname } = useLocation();
  const nav = useMenuNavigation({ count: mainNav.length, initialIndex: activeNavIndex(pathname) });
  return (
    <Window as="nav" aria-label={t('nav.main')}>
      <ul className="flex flex-col gap-0.5" onKeyDown={nav.onKeyDown}>
        {mainNav.map((entry, i) => {
          const icon = navIcons[entry.icon];
          const { ref, onClick: _click, ...itemProps } = nav.getItemProps(i);
          return (
            <li key={entry.to}>
              <NavLink
                to={entry.to}
                ref={ref}
                className="px-menu-item aria-[current=page]:text-win-accent"
                {...itemProps}
              >
                <CursorSlot visible={nav.activeIndex === i} />
                <PixelIcon matrix={icon.matrix} colors={icon.colors} scale={2} className="mr-2" />
                {t(entry.label)}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </Window>
  );
}

/** Abas inferiores (mobile). */
function BottomTabs() {
  return (
    <nav aria-label={t('nav.main')} className="win fixed inset-x-0 bottom-0 z-30 rounded-none px-1 py-1 md:hidden">
      <ul className="grid grid-cols-4">
        {mainNav.map((entry) => {
          const icon = navIcons[entry.icon];
          return (
            <li key={entry.to}>
              <NavLink
                to={entry.to}
                className="flex flex-col items-center gap-1 rounded py-1 font-title text-[0.5rem] text-win-dim text-shadow-pixel aria-[current=page]:text-win-accent"
              >
                <PixelIcon matrix={icon.matrix} colors={icon.colors} scale={3} />
                {t(entry.label)}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  const wide = useMediaQuery('(min-width: 768px)');
  const inQuests = wide && pathname.startsWith('/missoes');
  const needsHero = useGameStore((s) => !s.character.name);
  useReminders();
  useDayCycle();
  // Primeiro acesso: criação de personagem obrigatória (o /dev fica liberado).
  if (needsHero && !pathname.startsWith('/dev')) return <Navigate to="/criar" replace />;
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="win sr-only z-50 focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
      >
        {t('nav.skipToContent')}
      </a>
      <Hud />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-4 p-3 pb-28 sm:p-4 md:pb-4">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-4 overflow-y-auto pb-1">
            <Sidebar />
            {inQuests ? (
              <Window as="div">
                <ListsPanel />
              </Window>
            ) : null}
          </div>
        </aside>
        <main id="conteudo" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <Outlet />
        </main>
      </div>
      <BottomTabs />
      <Toasts />
      <FloatingNumbers />
      <DamageFx />
      <LevelUpOverlay />
      <NightReportDialog />
      <GameOverOverlay />
    </div>
  );
}
