import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from '@/app/router';
import { classBaseStats } from '@/sprites/characterParts';
import { initialPersistedState, useGameStore } from '@/store/useGameStore';
import { heroState } from '@/test/state';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

const store = () => useGameStore.getState();

describe('criação de personagem', () => {
  beforeEach(() => useGameStore.setState({ ...initialPersistedState(), hydrated: true }));

  it('primeiro acesso leva à criação e o herói é criado pelo teclado', async () => {
    const user = userEvent.setup();
    const router = renderAt('/missoes/meu-dia');
    expect(await screen.findByRole('heading', { name: 'Novo herói' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/criar');

    const name = screen.getByLabelText('Nome');
    await user.click(name);
    await user.type(name, 'Kaelthas Maximus');
    expect(name).toHaveValue('Kaelthas Max'); // 12 letras
    await user.keyboard('{ArrowDown}'); // Classe
    expect(screen.getByRole('button', { name: /^Classe: Guerreiro/ })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}'); // Mago → Ladino
    expect(screen.getByRole('button', { name: /^Classe: Ladino/ })).toBeInTheDocument();
    expect(screen.getByText('+20% Gold')).toBeInTheDocument();
    // Cada classe tem arte própria: não há mais opções de cabelo/pele/roupa.
    expect(screen.queryByRole('button', { name: /^Cabelo:/ })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Kaelthas Max — Ladino/ })).toBeInTheDocument();
    await user.keyboard('{End}{Enter}');

    expect(store().character).toMatchObject({
      name: 'Kaelthas Max',
      classId: 'rogue',
      stats: classBaseStats.rogue,
    });
    expect(router.state.location.pathname).toBe('/missoes/meu-dia');
  });

  it('exige nome antes de começar', async () => {
    const user = userEvent.setup();
    renderAt('/criar');
    await user.click(await screen.findByRole('button', { name: 'Começar aventura' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Dê um nome ao seu herói.');
    expect(store().character.name).toBe('');
    expect(screen.getByLabelText('Nome')).toHaveFocus();
  });

  it('as setas ▴ ▾ mudam as opções com o mouse', async () => {
    const user = userEvent.setup();
    renderAt('/criar');
    await user.click(await screen.findByRole('button', { name: 'Próximo: Classe' }));
    expect(screen.getByRole('button', { name: /^Classe: Mago/ })).toBeInTheDocument();
  });
});

describe('status e aparência', () => {
  beforeEach(() => useGameStore.setState(heroState()));

  it('distribui pontos pelo teclado', async () => {
    const user = userEvent.setup();
    useGameStore.setState({ character: { ...store().character, unspentPoints: 2 } });
    renderAt('/personagem');
    expect(await screen.findByText('Pontos para distribuir: 2')).toBeInTheDocument();
    const attrs = screen.getAllByRole('button', { name: /Adicionar ponto/ });
    attrs[0]!.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}{Enter}');
    expect(store().character.stats.vit).toBe(classBaseStats.warrior.vit + 2);
    expect(screen.getByText('Suba de nível para ganhar pontos.')).toBeInTheDocument();
  });

  it('mostra estatísticas vitalícias', async () => {
    useGameStore.setState({ lifetime: { ...store().lifetime, tasksCompleted: 42 } });
    renderAt('/personagem');
    const stats = await screen.findByRole('region', { name: 'Estatísticas' });
    expect(within(stats).getByText('42')).toBeInTheDocument();
  });

  it('aparência: classe travada antes do nível 10; muda o nome e salva', async () => {
    const user = userEvent.setup();
    const router = renderAt('/personagem/aparencia');
    const cls = await screen.findByRole('button', { name: /^Classe: Guerreiro/ });
    expect(cls).toHaveAttribute('aria-disabled', 'true');
    cls.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: /^Classe: Guerreiro/ })).toBeInTheDocument();
    const name = screen.getByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Lina');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(store().character.name).toBe('Lina');
    expect(store().character.classId).toBe('warrior');
    expect(router.state.location.pathname).toBe('/personagem');
  });

  it('reencarnação no nível 10 pede confirmação', async () => {
    const user = userEvent.setup();
    useGameStore.setState({ character: { ...store().character, level: 10 } });
    renderAt('/personagem/aparencia');
    (await screen.findByRole('button', { name: /^Classe: Guerreiro/ })).focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Renascer como Mago?');
    await user.click(within(dialog).getByRole('button', { name: 'Sim' }));
    expect(store().character).toMatchObject({ classId: 'mage', unspentPoints: 18 });
  });
});
