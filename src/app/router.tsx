import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { DevUiPage } from './pages/DevUiPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { SettingsPage } from './pages/SettingsPage';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/missoes" replace /> },
      { path: 'missoes/*', element: <PlaceholderPage title="page.quests.title" intro="page.quests.intro" phase={2} /> },
      {
        path: 'personagem',
        element: <PlaceholderPage title="page.character.title" intro="page.character.intro" phase={4} />,
      },
      { path: 'loja', element: <PlaceholderPage title="page.shop.title" intro="page.shop.intro" phase={6} /> },
      { path: 'menu', element: <SettingsPage /> },
      { path: 'dev/ui', element: <DevUiPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
