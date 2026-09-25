import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { ListsPage, QuestsPage } from '@/features/tasks/components/QuestsPage';
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
      {
        path: 'missoes',
        children: [
          { index: true, element: <Navigate to="meu-dia" replace /> },
          { path: 'listas', element: <ListsPage /> },
          { path: 'busca', element: <QuestsPage search /> },
          { path: 'lista/:listId', element: <QuestsPage /> },
          { path: ':slug', element: <QuestsPage /> },
        ],
      },
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
