import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/router';
import { initialPersistedState, useGameStore } from '@/store/useGameStore';
import { useToastStore } from '@/ui/toastStore';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

const store = () => useGameStore.getState();

describe('tela de missões', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
    useGameStore.setState({ ...initialPersistedState(), hydrated: true });
    useToastStore.setState({ toasts: [] });
  });
  afterEach(() => vi.useRealTimers());

  it('adiciona uma missão no Meu Dia com a dificuldade escolhida', async () => {
    const user = userEvent.setup();
    renderAt('/missoes/meu-dia');
    const input = await screen.findByLabelText('Nova missão');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Dificuldade' }), 'hard');
    await user.type(input, 'Derrotar o slime{Enter}');
    const [task] = store().tasks;
    expect(task).toMatchObject({ title: 'Derrotar o slime', difficulty: 'hard', myDayDate: '2026-09-25' });
    expect(screen.getByRole('list', { name: 'Meu Dia' })).toHaveTextContent('Derrotar o slime');
    expect(input).toHaveValue('');
  });

  it('concluir mostra toast e Desfazer reabre a missão', async () => {
    const user = userEvent.setup();
    store().addTask({ title: 'Coletar ervas', myDay: true });
    renderAt('/missoes/meu-dia');
    await user.click(await screen.findByRole('checkbox', { name: 'Concluir "Coletar ervas"' }));
    expect(store().tasks[0]!.completedAt).toBeDefined();
    expect(screen.getByText('Missão concluída!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(store().tasks[0]!.completedAt).toBeUndefined();
  });

  it('teclado: setas movem, Espaço conclui, S marca importante e Enter abre detalhes', async () => {
    const user = userEvent.setup();
    const a = store().addTask({ title: 'A', listId: 'inbox' });
    const b = store().addTask({ title: 'B', listId: 'inbox' });
    const router = renderAt('/missoes/lista/inbox');
    const rows = await screen.findAllByRole('button', { name: /^(A|B)$/ });
    rows[0]!.focus(); // B está no topo
    await user.keyboard('{ArrowDown}');
    expect(rows[1]).toHaveFocus();
    await user.keyboard('s');
    expect(store().tasks.find((x) => x.id === a)!.important).toBe(true);
    await user.keyboard('{ArrowUp} ');
    expect(store().tasks.find((x) => x.id === b)!.completedAt).toBeDefined();
    await user.keyboard('{Enter}');
    expect(router.state.location.search).toContain(`tarefa=${a}`);
  });

  it('detalhes: passos, vencimento, recorrência e notas', async () => {
    const user = userEvent.setup();
    const id = store().addTask({ title: 'Forjar espada' });
    renderAt(`/missoes/lista/inbox?tarefa=${id}`);
    const detail = await screen.findByRole('region', { name: 'Detalhes da missão' });
    const d = within(detail);
    await user.type(d.getByPlaceholderText('+ Adicionar passo'), 'Minerar ferro{Enter}');
    expect(store().tasks[0]!.subtasks.map((s) => s.title)).toEqual(['Minerar ferro']);
    await user.click(d.getByRole('button', { name: 'Amanhã' }));
    expect(store().tasks[0]!.dueDate).toBe('2026-09-26');
    await user.selectOptions(d.getByLabelText('Repetir'), 'weekly');
    await user.click(d.getByRole('button', { name: 'seg' }));
    expect(store().tasks[0]!.recurrence).toEqual({ type: 'weekly', days: [1] });
    await user.type(d.getByLabelText('Notas'), 'Levar carvão');
    await user.tab();
    expect(store().tasks[0]!.notes).toBe('Levar carvão');
    await user.type(d.getByLabelText('Tags'), 'ferreiro{Enter}');
    expect(store().tasks[0]!.tags).toEqual(['ferreiro']);
  });

  it('Planejado agrupa por data', async () => {
    store().addTask({ title: 'Atrasada', dueDate: '2026-09-20' });
    store().addTask({ title: 'Hoje mesmo', dueDate: '2026-09-25' });
    renderAt('/missoes/planejado');
    const list = await screen.findByRole('list', { name: 'Planejado' });
    expect(list).toHaveTextContent(/Atrasadas \(1\).*Atrasada.*Hoje \(1\).*Hoje mesmo/);
  });

  it('busca global encontra por notas e #tag', async () => {
    const user = userEvent.setup();
    const id = store().addTask({ title: 'Visitar a vila' });
    store().updateTask(id, { notes: 'falar com o ferreiro', tags: ['viagem'] });
    store().addTask({ title: 'Outra coisa' });
    renderAt('/missoes/busca');
    const input = await screen.findByRole('searchbox', { name: 'Buscar missões' });
    await user.type(input, 'ferreiro');
    expect(screen.getByRole('list', { name: 'Busca' })).toHaveTextContent('Visitar a vila');
    await user.clear(input);
    await user.type(input, '#viagem');
    expect(screen.getByRole('list', { name: 'Busca' })).not.toHaveTextContent('Outra coisa');
  });

  it('cria uma lista nova, renomeia e mostra na barra de listas', async () => {
    const user = userEvent.setup();
    const router = renderAt('/missoes/listas');
    await user.click(await screen.findByRole('button', { name: '+ Nova lista' }));
    const dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Guilda');
    await user.click(within(dialog).getByRole('button', { name: 'Espada' }));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    const list = store().lists.find((l) => l.name === 'Guilda')!;
    expect(list.icon).toBe('sword');
    expect(router.state.location.pathname).toBe(`/missoes/lista/${list.id}`);
  });

  it('excluir missão pelo teclado pode ser desfeito', async () => {
    const user = userEvent.setup();
    store().addTask({ title: 'Temporária' });
    renderAt('/missoes/todas');
    (await screen.findByRole('button', { name: /^Temporária/ })).focus();
    await user.keyboard('{Delete}');
    expect(store().tasks).toHaveLength(0);
    await act(async () => {
      await user.keyboard('{Control>}z{/Control}');
    });
    expect(store().tasks).toHaveLength(1);
  });
});
