import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/router';
import { useGameStore } from '@/store/useGameStore';
import { heroState } from '@/test/state';
import { useToastStore } from '@/ui/toastStore';
import { maxHp } from '@/features/progression/formulas';
import { dailyOffers } from './offers';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

const store = () => useGameStore.getState();
const day = '2026-09-25';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
  useGameStore.setState(heroState());
  useGameStore.setState((s) => ({ character: { ...s.character, gold: 500, level: 5, lastDayProcessed: day } }));
  useToastStore.setState({ toasts: [] });
});
afterEach(() => vi.useRealTimers());

describe('loja', () => {
  it('mostra o mercador e as 4 ofertas do dia com desconto', async () => {
    renderAt('/loja');
    expect(await screen.findByRole('img', { name: 'Bartolo, o Mercador' })).toBeInTheDocument();
    const grid = screen.getByRole('list', { name: 'Itens à venda' });
    expect(within(grid).getAllByRole('button')).toHaveLength(4);
    expect(within(grid).getAllByText('−20%').length).toBeGreaterThan(0);
    expect(dailyOffers(day)).toHaveLength(4);
  });

  it('compra pelo teclado com confirmação e equipa', async () => {
    const user = userEvent.setup();
    renderAt('/loja');
    await user.click(await screen.findByRole('tab', { name: 'Chapéus' }));
    const grid = screen.getByRole('list', { name: 'Itens à venda' });
    const cards = within(grid).getAllByRole('button');
    cards[0]!.focus();
    await user.keyboard('{ArrowRight}'); // Chapéu de Palha
    expect(screen.getByRole('region', { name: 'Prévia' })).toHaveTextContent('Chapéu de Palha');
    await user.keyboard('{Enter}'); // foca "Comprar"
    expect(screen.getByRole('button', { name: 'Comprar' })).toHaveFocus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Comprar' });
    expect(dialog).toHaveTextContent(/Comprar Chapéu de Palha por \d+G\?/);
    await user.click(within(dialog).getByRole('button', { name: 'Sim' }));
    expect(store().character.inventory).toEqual([{ itemId: 'hat-straw', qty: 1 }]);
    expect(store().character.gold).toBeLessThan(500);
    await user.click(screen.getByRole('button', { name: 'Equipar' }));
    expect(store().character.equipped.hat).toBe('hat-straw');
    expect(screen.getByRole('button', { name: 'Tirar' })).toBeInTheDocument();
  });

  it('o mercador avisa quando falta ouro ou nível', async () => {
    const user = userEvent.setup();
    useGameStore.setState((s) => ({ character: { ...s.character, gold: 0 } }));
    renderAt('/loja');
    await user.click(await screen.findByRole('tab', { name: 'Chapéus' }));
    await user.click(screen.getByRole('button', { name: /^Bandana Rubra/ }));
    await user.click(screen.getByRole('button', { name: 'Comprar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // A fala completa já está disponível para leitores de tela enquanto é "digitada":
    // o teste não depende do relógio (antes esperava a digitação em tempo real e oscilava sob carga).
    expect(await screen.findByText('Hmm... parece que falta ouro na sua bolsa.')).toBeInTheDocument();
    expect(store().character.inventory).toEqual([]);
  });
});

describe('equipamento', () => {
  it('equipa pelo menu de espaços e usa a poção', async () => {
    const user = userEvent.setup();
    useGameStore.setState((s) => ({
      character: {
        ...s.character,
        hp: 20,
        inventory: [
          { itemId: 'wpn-sword', qty: 1 },
          { itemId: 'potion-life', qty: 1 },
        ],
      },
    }));
    renderAt('/personagem/equipamento');
    const slots = await screen.findByRole('region', { name: 'Espaços' });
    within(slots).getAllByRole('button')[0]!.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}'); // Arma
    const choose = screen.getByRole('region', { name: 'Escolha para Arma' });
    await user.click(within(choose).getByRole('button', { name: /Espada Curta/ }));
    expect(store().character.equipped.weapon).toBe('wpn-sword');
    await user.click(within(choose).getByRole('button', { name: /nada/ }));
    expect(store().character.equipped.weapon).toBeUndefined();

    await user.click(screen.getByRole('button', { name: 'Usar' }));
    expect(store().character.hp).toBe(35);
    expect(store().character.inventory).toEqual([{ itemId: 'wpn-sword', qty: 1 }]);
    expect(maxHp(5)).toBeGreaterThan(35);
  });
});
