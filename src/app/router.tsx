import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { ListsPage, QuestsPage } from '@/features/tasks/components/QuestsPage';
import { lazy, Suspense, type ComponentType } from 'react';
import { AppLayout } from './AppLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { PageLoading } from './PageLoading';

/** Carrega uma página sob demanda (divide o pacote por tela). */
function page<T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) {
  return lazy(async () => ({ default: (await load())[name] as ComponentType }));
}

const CreateCharacterPage = page(() => import('@/features/character/CharacterPages'), 'CreateCharacterPage');
const AppearancePage = page(() => import('@/features/character/CharacterPages'), 'AppearancePage');
const StatusPage = page(() => import('@/features/character/CharacterPages'), 'StatusPage');
const ShopPage = page(() => import('@/features/shop/ShopPage'), 'ShopPage');
const EquipmentPage = page(() => import('@/features/shop/EquipmentPage'), 'EquipmentPage');
const SettingsPage = page(() => import('./pages/SettingsPage'), 'SettingsPage');
const DevUiPage = page(() => import('./pages/DevUiPage'), 'DevUiPage');
const DevSpritesPage = page(() => import('./pages/DevSpritesPage'), 'DevSpritesPage');

export const routes: RouteObject[] = [
  {
    path: 'criar',
    element: (
      <Suspense fallback={<PageLoading />}>
        <CreateCharacterPage />
      </Suspense>
    ),
  },
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
