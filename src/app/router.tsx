import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { ListsPage, QuestsPage } from '@/features/tasks/components/QuestsPage';
import { AppearancePage, CreateCharacterPage, StatusPage } from '@/features/character/CharacterPages';
import { EquipmentPage } from '@/features/shop/EquipmentPage';
import { ShopPage } from '@/features/shop/ShopPage';
import { AppLayout } from './AppLayout';
import { DevSpritesPage } from './pages/DevSpritesPage';
import { DevUiPage } from './pages/DevUiPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SettingsPage } from './pages/SettingsPage';

export const routes: RouteObject[] = [
  { path: 'criar', element: <CreateCharacterPage /> },
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
      { path: 'personagem', element: <StatusPage /> },
      { path: 'personagem/aparencia', element: <AppearancePage /> },
      { path: 'loja', element: <ShopPage /> },
      { path: 'personagem/equipamento', element: <EquipmentPage /> },
      { path: 'menu', element: <SettingsPage /> },
      { path: 'dev/ui', element: <DevUiPage /> },
      { path: 'dev/sprites', element: <DevSpritesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
