import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Bar } from './Bar';
import { Dialog } from './Dialog';
import { Menu } from './Menu';
import { hpColor, palette } from './palette';
import { Tabs } from './Tabs';
import { Window } from './Window';

describe('Window', () => {
  it('usa o título como rótulo acessível', () => {
    render(<Window title="Status">conteúdo</Window>);
    expect(screen.getByRole('region', { name: 'Status' })).toHaveTextContent('conteúdo');
  });
});

describe('Bar', () => {
  it('expõe valores ARIA e limita ao máximo', () => {
    render(<Bar kind="hp" label="HP" value={80} max={55} />);
    const bar = screen.getByRole('progressbar', { name: 'HP' });
    expect(bar).toHaveAttribute('aria-valuenow', '55');
    expect(bar).toHaveAttribute('aria-valuemax', '55');
  });

  it('não aceita valores negativos', () => {
    render(<Bar kind="xp" label="XP" value={-5} max={75} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('muda a cor do HP de verde para amarelo e vermelho', () => {
    expect(hpColor(0.9)).toBe(palette.hpGreen);
    expect(hpColor(0.4)).toBe(palette.hpYellow);
    expect(hpColor(0.1)).toBe(palette.hpRed);
  });
});

describe('Menu', () => {
  const items = [
    { id: 'a', label: 'Atacar' },
    { id: 'b', label: 'Magia' },
    { id: 'c', label: 'Fugir', disabled: true },
    { id: 'd', label: 'Item' },
  ];

  it('navega com setas, pula itens desabilitados e confirma com Enter', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Menu aria-label="Batalha" items={items} onSelect={onSelect} />);
    const [atacar, magia, , item] = screen.getAllByRole('menuitem');
    await user.tab();
    expect(atacar).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(magia).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(item).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(atacar).toHaveFocus(); // volta ao início
    await user.keyboard('{ArrowUp}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(items[3]);
  });

  it('Esc chama onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Menu aria-label="Batalha" items={items} onSelect={() => {}} onCancel={onCancel} />);
    await user.tab();
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('só o item ativo é tabulável (roving tabindex)', () => {
    render(<Menu aria-label="Batalha" items={items} onSelect={() => {}} />);
    const tabbable = screen.getAllByRole('menuitem').filter((el) => el.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
  });
});

describe('Tabs', () => {
  function Harness() {
    const [value, setValue] = useState<'a' | 'b' | 'c'>('a');
    return (
      <Tabs
        aria-label="Categorias"
        tabs={[
          { id: 'a', label: 'Chapéus' },
          { id: 'b', label: 'Roupas' },
          { id: 'c', label: 'Pets' },
        ]}
        value={value}
        onChange={setValue}
      >
        painel {value}
      </Tabs>
    );
  }

  it('troca de aba com as setas', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    expect(screen.getByRole('tab', { name: 'Chapéus' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Roupas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('painel b');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Pets' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Dialog', () => {
  it('digita o texto, fecha com Esc e escolhe ação com setas', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onClose = vi.fn();
    const onYes = vi.fn();
    render(
      <Dialog
        open
        onClose={onClose}
        text="Comprar por 120G?"
        actions={[
          { label: 'Não', onSelect: onClose },
          { label: 'Sim', onSelect: onYes },
        ]}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Texto completo disponível para leitores de tela desde o início.
    expect(dialog).toHaveTextContent('Comprar por 120G?');
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Não' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onYes).toHaveBeenCalledOnce();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('não renderiza nada fechado', () => {
    render(<Dialog open={false} onClose={() => {}} text="oi" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
