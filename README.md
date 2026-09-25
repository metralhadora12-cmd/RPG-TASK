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

## Funcionalidades

### Fase 2 — Tarefas

- **Listas inteligentes** na barra lateral, com contadores:
  - **Meu Dia**: reseta sozinho na virada do dia (respeita o horário configurado) e sugere tarefas atrasadas, que vencem hoje ou que estavam no Meu Dia de ontem.
  - **Importante**.
  - **Planejado**: agrupado em Atrasadas / Hoje / Amanhã / Esta semana / Depois, respeitando o início da semana configurado.
  - **Todas** e **Concluídas**.
- **Listas do usuário**: criar, renomear, excluir (com Desfazer), ícone pixel (12 opções), cor, grupos (pastas recolhíveis) e reordenação por arrastar e soltar, também pelo teclado.
- **Missões**:
  - título, notas, passos (subtarefas), vencimento com atalhos (Hoje/Amanhã/Próx. semana) e lembrete (Notification API, com aviso dentro do app quando as notificações estão bloqueadas);
  - recorrência: diária, dias úteis, semanal com dias escolhidos, mensal, anual e a cada N dias;
  - dificuldade (5 níveis), importante, Meu Dia, tags e mover entre listas.
- **Recorrência**: ao concluir uma missão recorrente, a próxima ocorrência é criada com os passos zerados e o lembrete deslocado. Se a missão estava atrasada, a nova data nunca cai no passado.
- **Ordenação** por visão (manual, data, importância, dificuldade, alfabética). A escolha fica salva. Na ordenação manual, as missões podem ser arrastadas.
- **Busca global**: ignora acentos e procura em título, notas, passos e tags. Use `#tag` para buscar só nas tags.
- **Desfazer**: concluir ou excluir mostra um aviso com "Desfazer" por 5 s (ou Ctrl/Cmd+Z).

#### Atalhos de teclado

| Tecla | Ação |
|---|---|
| ↑ / ↓ | mover o cursor entre missões (e entre listas na barra lateral) |
| Enter | abrir detalhes |
| Espaço | concluir / reabrir |
| S | marcar como importante |
| Delete | excluir |
| / | buscar |
| N | nova missão |
| Esc | fechar detalhes/diálogos |
| Ctrl/Cmd+Z | desfazer a última ação com aviso |

Para arrastar pelo teclado: foque a alça ⋮⋮, pressione Espaço, use as setas e Espaço para soltar.

### Fase 1 — Fundação

- **Design system 16-bit** (`src/ui/`): `Window`, `Button`, `Bar`, `Cursor`, `Menu`, `Tabs`, `Dialog`, `Checkbox`, `Toasts`, `PixelIcon`, mais os hooks `useMenuNavigation` (setas / Enter / Esc, roving tabindex), `useTypewriter` e `useReducedMotion`.
- **Paleta e temas** (`src/ui/palette.ts`): paleta limitada e 5 temas de janela (Azul Clássico, Pergaminho, Floresta, Lava, Noite Estrelada), aplicados como variáveis CSS. Um teste garante contraste AA (≥ 4,5) do texto em todo o gradiente de cada tema.
- **Fontes** Press Start 2P (títulos) e VT323 (texto), empacotadas via @fontsource para funcionar offline. A opção "Fonte legível" troca o texto do corpo por uma fonte do sistema.
- **Rotas**: `/missoes/...`, `/personagem`, `/loja`, `/menu` (configurações) e `/dev/ui` (vitrine do design system). Barra lateral no desktop e abas inferiores no mobile.
- **Store** (`src/store/`): Zustand com `persist` em IndexedDB (`idb-keyval`), estado versionado (v2) e migrações testadas. O modelo de dados fica em `src/store/types.ts`.
- **i18n** (`src/lib/i18n`): pt-BR completo, inglês parcial com fallback.

### Telas (descrição)

- **Meu Dia (desktop)**:
  - no topo, o HUD azul;
  - à esquerda, o menu principal e o painel de listas (busca, listas inteligentes com contadores, listas do usuário);
  - no centro, o cabeçalho com a data por extenso, o campo "Adicionar uma missão" com a dificuldade e as missões. Cada linha tem alça de arrastar, caixa de seleção pixel, título, detalhes (lista, vencimento, recorrência ↻, passos "0 de 2", tags), pips coloridos de dificuldade e estrela;
  - à direita, o painel de detalhes da missão selecionada.
- **Planejado**: seções "Atrasadas (n)", "Hoje (n)", "Amanhã (n)" etc.
- **Mobile**: o cabeçalho tem um botão ◂ que abre a página de listas. Os detalhes abrem em tela cheia sobre a lista.
- **/dev/ui**: vitrine dos componentes com troca de tema ao vivo.

## Fórmulas (até agora)

| Fórmula | Definição |
|---|---|
| XP para o próximo nível | `round(25 · n^1.5 + 50)` (nível 1 → 75, nível 10 → 841) |
| HP máximo | `50 + 5 · nível` |
| MP máximo | `20 + 2 · nível` |

As fórmulas ficam em `src/features/progression/formulas.ts`, como funções puras com testes. Recompensas e modificadores entram na Fase 3.
