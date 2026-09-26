import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/router';
import { useFxStore } from '@/features/progression/fxStore';
import { maxHp } from '@/features/progression/formulas';
import { useGameStore } from '@/store/useGameStore';
import { heroState } from '@/test/state';
import { useToastStore } from '@/ui/toastStore';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

const store = () => useGameStore.getState();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // sexta
  useGameStore.setState(heroState());
  useGameStore.setState((s) => ({ character: { ...s.character, lastDayProcessed: '2026-09-25' } }));
  useToastStore.setState({ toasts: [] });
  useFxStore.setState({ floats: [], levelUp: null, hitKey: 0 });
});
afterEach(() => vi.useRealTimers());

describe('rotinas', () => {
  it('cria rotina, separa as que valem hoje e aparece no Meu Dia', async () => {
    const user = userEvent.setup();
    renderAt('/missoes/rotinas');
    await user.type(await screen.findByPlaceholderText('+ Adicionar uma rotina'), 'Alongar{Enter}');
    const weekend = store().addTask({ title: 'Faxina', kind: 'daily' });
    store().updateTask(weekend, { recurrence: { type: 'weekly', days: [6] } });
    const list = await screen.findByRole('list', { name: 'Rotinas' });
    expect(list).toHaveTextContent(/Valem hoje \(1\).*Alongar.*Fora do dia \(1\).*Faxina/);
    expect(store().tasks.find((t) => t.title === 'Alongar')).toMatchObject({ kind: 'daily', recurrence: { type: 'daily' } });
  });

  it('concluir soma sequência visível', async () => {
    const user = userEvent.setup();
    const id = store().addTask({ title: 'Ler', kind: 'daily' });
    store().updateTask(id, { streak: 2 });
    renderAt('/missoes/meu-dia');
    await user.click(await screen.findByRole('checkbox', { name: 'Concluir "Ler"' }));
    expect(store().tasks[0]!.streak).toBe(3);
  });
});

describe('hábitos', () => {
  it('+ e − pelo mouse e pelo teclado, com números e dano', async () => {
    const user = userEvent.setup();
    store().addTask({ title: 'Água', kind: 'habit', difficulty: 'easy' });
    renderAt('/missoes/habitos');
    await user.click(await screen.findByRole('button', { name: 'Fiz "Água" (+)' }));
    expect(store().character.xp).toBe(10);
    expect(screen.getByText('Hoje: +1 / −0')).toBeInTheDocument();
    screen.getByRole('button', { name: /^Água/ }).focus();
    await user.keyboard('-');
    expect(store().character.hp).toBe(maxHp(1) - 3);
    expect(useFxStore.getState().hitKey).toBe(1);
    expect(screen.getByText('Hoje: +1 / −1')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Desfazer' }).at(-1)!);
    expect(store().character.hp).toBe(maxHp(1));
  });

  it('direção "só +" esconde o botão −', async () => {
    const id = store().addTask({ title: 'Correr', kind: 'habit' });
    store().updateTask(id, { habitDirection: 'up' });
    renderAt('/missoes/habitos');
    expect(await screen.findByRole('button', { name: 'Fiz "Correr" (+)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deslizei em "Correr" (−)' })).not.toBeInTheDocument();
  });

  it('− até zerar o HP mostra o Game Over', async () => {
    const user = userEvent.setup();
    useGameStore.setState((s) => ({ character: { ...s.character, hp: 2, xp: 40, gold: 50 } }));
    store().addTask({ title: 'Doce', kind: 'habit', difficulty: 'epic' });
    renderAt('/missoes/habitos');
    await user.click(await screen.findByRole('button', { name: 'Deslizei em "Doce" (−)' }));
    const over = await screen.findByRole('alertdialog', { name: 'GAME OVER' });
    expect(over).toHaveTextContent('XP do nível 1 perdido: 40');
    expect(over).toHaveTextContent('Gold perdido: 5');
    await user.click(within(over).getByRole('button', { name: 'Continuar' }));
    expect(store().pendingFaint).toBeNull();
  });
});

describe('relatório da noite', () => {
  it('aparece na primeira abertura do dia e lista o dano', async () => {
    const user = userEvent.setup();
    store().addTask({ title: 'Treinar', kind: 'daily', difficulty: 'hard' });
    vi.setSystemTime(new Date(2026, 8, 26, 9, 0));
    renderAt('/missoes/meu-dia');
    const dialog = await screen.findByRole('dialog', { name: 'Relatório da noite' });
    expect(dialog).toHaveTextContent('Treinar: −7 HP');
    expect(dialog).toHaveTextContent('Total: −7 HP');
    expect(store().character.hp).toBe(maxHp(1) - 7);
    await user.click(within(dialog).getByRole('button', { name: 'Continuar' }));
    expect(store().pendingReport).toBeNull();
  });
});
