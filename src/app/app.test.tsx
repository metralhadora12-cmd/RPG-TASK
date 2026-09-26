import { act, render, screen, within } from '@testing-library/react';
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

    // Sem o item, o tema nem aparece; com ele, escolher equipa.
    expect(screen.queryByRole('option', { name: 'Lava' })).not.toBeInTheDocument();
    await act(async () => {
      useGameStore.setState((s) => ({
        character: { ...s.character, inventory: [{ itemId: 'theme-lava', qty: 1 }] },
      }));
    });
    await user.selectOptions(screen.getByLabelText('Tema das janelas'), 'lava');
    expect(useGameStore.getState().settings.theme).toBe('lava');
    expect(useGameStore.getState().character.equipped.theme).toBe('theme-lava');
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

describe('backup nas configurações', () => {
  beforeEach(() => {
    useGameStore.setState(heroState());
  });

  it('importa um arquivo de backup após confirmação', async () => {
    const user = userEvent.setup();
    renderAt('/menu');
    const backup = {
      app: 'questlog',
      version: 6,
      exportedAt: '2026-09-25T00:00:00.000Z',
      state: { ...heroState(), character: { ...useGameStore.getState().character, name: 'Bento', level: 7 } },
    };
    const file = new File([JSON.stringify(backup)], 'b.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Importar backup', { selector: 'input' }), file);
    const dialog = await screen.findByRole('dialog', { name: 'Importar backup' });
    expect(dialog).toHaveTextContent('backup de Bento (nível 7)');
    await user.click(within(dialog).getByRole('button', { name: 'Sim' }));
    expect(useGameStore.getState().character).toMatchObject({ name: 'Bento', level: 7 });
  });

  it('avisa quando o arquivo não é um backup', async () => {
    const user = userEvent.setup();
    renderAt('/menu');
    const file = new File(['oops'], 'x.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Importar backup', { selector: 'input' }), file);
    expect(await screen.findByText('Arquivo inválido: não parece um backup do QuestLog.')).toBeInTheDocument();
  });
});
