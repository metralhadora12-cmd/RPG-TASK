import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/store/useGameStore';
import { heroState } from '@/test/state';
import { routes } from './router';
import { SettingsEffects } from './SettingsEffects';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <>
      <SettingsEffects />
      <RouterProvider router={router} />
    </>,
  );
  return router;
}

describe('App', () => {
  beforeEach(() => {
    useGameStore.setState(heroState());
  });

  it('redireciona / para Missões e mostra HUD e navegação', async () => {
    const router = renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Meu Dia' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/missoes/meu-dia');
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
    expect(screen.getAllByRole('navigation', { name: 'Navegação principal' }).length).toBeGreaterThan(0);
  });

  it('navega pela barra lateral com o teclado', async () => {
    const user = userEvent.setup();
    const router = renderAt('/missoes');
    const [sidebar] = screen.getAllByRole('navigation', { name: 'Navegação principal' });
    const links = sidebar!.querySelectorAll('a');
    links[0]!.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(links[2]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(router.state.location.pathname).toBe('/loja');
  });

  it('configurações alteram a store e o documento', async () => {
    const user = userEvent.setup();
    renderAt('/menu');
    const fontSwitch = await screen.findByRole('switch', { name: 'Fonte legível' });
    expect(fontSwitch).toHaveAttribute('aria-checked', 'false');
    await user.click(fontSwitch);
    expect(useGameStore.getState().settings.readableFont).toBe(true);
    expect(document.documentElement).toHaveClass('font-readable');

    await user.selectOptions(screen.getByLabelText('Tema das janelas'), 'lava');
    expect(useGameStore.getState().settings.theme).toBe('lava');
    expect(document.documentElement.style.getPropertyValue('--win-top')).toBe('#98301a');
  });

  it('resetar progresso exige confirmação dupla', async () => {
    const user = userEvent.setup();
    useGameStore.setState({ tasks: [{ id: 'x' } as never] });
    renderAt('/menu');
    await user.click(await screen.findByRole('button', { name: 'Resetar progresso' }));
    await user.click(await screen.findByRole('button', { name: 'Sim' }));
    expect(useGameStore.getState().tasks).toHaveLength(1);
    await user.click(await screen.findByRole('button', { name: 'Sim' }));
    expect(useGameStore.getState().tasks).toHaveLength(0);
  });

  it('mostra página de caminho perdido para rotas desconhecidas', async () => {
    renderAt('/nao-existe');
    expect(await screen.findByRole('heading', { name: 'Caminho perdido' })).toBeInTheDocument();
  });
});
