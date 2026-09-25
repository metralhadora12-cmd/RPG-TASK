# QuestLog

Gerenciador de tarefas no estilo Microsoft To Do com a gamificação do Habitica e o visual de um JRPG de 16 bits. Concluir tarefas dá XP e Gold, o personagem sobe de nível e o Gold é gasto numa loja de cosméticos. Funciona 100% offline: os dados ficam no IndexedDB do navegador.

A especificação completa e o plano de fases estão em [`CLAUDE.md`](./CLAUDE.md).

## Como rodar

```bash
npm install
npm run dev        # servidor de desenvolvimento (http://localhost:5173)
npm test           # testes (Vitest + Testing Library)
npm run build      # typecheck + build de produção
npm run preview    # serve o build
```

## Estado atual — Fase 1 (Fundação)

- **Design system 16-bit** (`src/ui/`): `Window`, `Button`, `Bar`, `Cursor`, `Menu`, `Tabs`, `Dialog`, `PixelIcon`, mais os hooks `useMenuNavigation` (setas / Enter / Esc, roving tabindex), `useTypewriter` e `useReducedMotion`.
- **Paleta e temas** (`src/ui/palette.ts`): paleta limitada e 5 temas de janela (Azul Clássico, Pergaminho, Floresta, Lava, Noite Estrelada), aplicados como variáveis CSS. Um teste garante contraste AA (≥ 4,5) do texto em todo o gradiente de cada tema.
- **Fontes** Press Start 2P (títulos) e VT323 (texto), empacotadas via @fontsource para funcionar offline. A opção "Fonte legível" troca o texto do corpo por uma fonte do sistema.
- **Rotas**: `/missoes`, `/personagem`, `/loja`, `/menu` (configurações) e `/dev/ui` (vitrine do design system). Barra lateral no desktop e abas inferiores no mobile.
- **HUD fixo**: retrato, nome, nível, barras de HP/MP/XP e Gold.
- **Store** (`src/store/`): Zustand com `persist` em IndexedDB (`idb-keyval`), estado versionado e migrações testadas. O modelo de dados (tarefas, listas, personagem, log de recompensas) fica em `src/store/types.ts`.
- **i18n** (`src/lib/i18n`): pt-BR completo, inglês parcial com fallback.

### Telas (descrição)

- **Missões (desktop)**: HUD azul no topo com o retrato do herói, barras verde/azul/dourada e contador de ouro; à esquerda, uma janela de menu com a mãozinha apontando para a seção atual.
- **/dev/ui**: abas de tema que recolorem a interface inteira ao vivo; barras com botões Dano/Curar/+XP (o HP vai do verde ao amarelo e ao vermelho, em degraus); um menu de batalha navegável pelas setas; e um diálogo com efeito de digitação.
- **Menu (mobile)**: configurações empilhadas numa janela, com as abas inferiores Missões / Personagem / Loja / Menu.

## Fórmulas (até agora)

| Fórmula | Definição |
|---|---|
| XP para o próximo nível | `round(25 · n^1.5 + 50)` (nível 1 → 75, nível 10 → 841) |
| HP máximo | `50 + 5 · nível` |
| MP máximo | `20 + 2 · nível` |

As fórmulas ficam em `src/features/progression/formulas.ts`, como funções puras com testes. Recompensas e modificadores entram na Fase 3.
