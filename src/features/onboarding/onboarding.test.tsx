import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from '@/app/router';
import { useGameStore } from '@/store/useGameStore';
import { heroState } from '@/test/state';

describe('onboarding', () => {
  beforeEach(() => useGameStore.setState({ ...heroState(), onboardingDone: false }));

  it('mostra 3 diálogos da mentora e não volta depois', async () => {
    const user = userEvent.setup();
    render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/missoes/meu-dia'] })} />);
    let dialog = await screen.findByRole('dialog', { name: 'Sábia Lúmen (1/3)' });
    expect(dialog).toHaveTextContent('Olá, Aria!');
    await user.click(within(dialog).getByRole('button', { name: 'Próximo' }));
    dialog = await screen.findByRole('dialog', { name: 'Sábia Lúmen (2/3)' });
    await user.click(within(dialog).getByRole('button', { name: 'Próximo' }));
    dialog = await screen.findByRole('dialog', { name: 'Sábia Lúmen (3/3)' });
    await user.click(within(dialog).getByRole('button', { name: 'Vamos lá!' }));
    expect(useGameStore.getState().onboardingDone).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pode ser pulado com Esc', async () => {
    const user = userEvent.setup();
    render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/missoes/meu-dia'] })} />);
    await screen.findByRole('dialog', { name: 'Sábia Lúmen (1/3)' });
    await user.keyboard('{Escape}');
    expect(useGameStore.getState().onboardingDone).toBe(true);
  });
});
