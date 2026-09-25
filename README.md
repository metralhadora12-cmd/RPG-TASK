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

### Fase 5 — Rotinas e hábitos

- **Rotinas** (`/missoes/rotinas`): tarefas diárias com recorrência (diária, dias úteis, semanal com dias, mensal, anual, a cada N dias) contada a partir da data de início.
  - A tela separa "Valem hoje" de "Fora do dia". As rotinas que valem hoje também aparecem no **Meu Dia**.
  - Concluir soma **sequência**, que dá +2% por dia até +40% e alimenta a "Maior sequência" do Status. Reabrir devolve a sequência.
- **Hábitos** (`/missoes/habitos`): botões **+** e **−** que podem ser usados várias vezes ao dia, com contador diário e opção de mostrar só +, só − ou ambos.
  - + dá XP/Gold como uma conclusão; − causa dano, com número vermelho, tremida da tela e flash.
  - Tudo com "Desfazer". Pelo teclado, as teclas + e − agem no hábito focado.
- **Virada do dia**: na primeira abertura do dia (ou quando o dia vira com o app aberto, respeitando o horário configurado), os dias pendentes são fechados.
  - Rotina que valia e não foi feita causa dano uma única vez, mesmo depois de vários dias sem abrir (como no Habitica), e perde a sequência.
  - Rotinas feitas voltam a ficar pendentes, com os passos desmarcados.
- **Relatório da noite**: diálogo com as rotinas cumpridas e esquecidas, o dano de cada uma, o total e as sequências perdidas.
- **Desmaio**: HP chegou a 0 → o XP volta ao início do nível atual, perde 10% do Gold e o HP enche. Aparece a tela de **GAME OVER** com o herói caído, as perdas e "Continuar". O evento não pode ser desfeito.
- **Penalidades desligáveis** em Menu: sem dano, mas a sequência ainda zera.
- O painel da missão tem o campo **Tipo** (Missão/Rotina/Hábito) e mostra "Dano se falhar".

### Fase 4 — Personagem

- **Sprites procedurais em camadas** (`src/sprites/`). Cada parte é uma matriz 32×32 de chaves de paleta, escrita como texto em `layerData.ts`. Camadas simétricas guardam só a metade esquerda, que é espelhada em tempo de execução.
  - O `compose.ts` junta as camadas em ordem fixa: fundo/capa → cabelo de trás → corpo → roupa → rosto → cabelo → chapéu → braços → arma → acessório → mascote.
  - Cada camada tem a própria paleta, então recolorir é só trocar a paleta.
  - O resultado é desenhado em `<canvas>` com `imageSmoothingEnabled = false` e escala inteira.
- **Poses**:
  - parado, com 2 quadros de respiração (a cabeça desce 1px);
  - vitória, com o braço erguido;
  - desmaiado, com o sprite girado e apoiado no chão e os olhos fechados.
- **Silhuetas**: esguia, ou robusta, que alarga o tronco em 2px e afasta as pernas por transformação procedural, sem arte duplicada.
- **Criação de personagem** (obrigatória no primeiro acesso, em `/criar`):
  - menu de JRPG com prévia ao vivo;
  - nome (até 12 letras), classe com descrição, bônus e atributos iniciais;
  - corpo (2), pele (8), cabelo (10 estilos × 12 cores), olhos (6) e roupa (3 por classe);
  - botão **Aleatório** com d20 que gira e o herói comemora;
  - teclado: ↑/↓ entre opções, ←/→ muda o valor, Enter confirma.
- **Aparência** (`/personagem/aparencia`): nome, cabelo e cores mudam de graça. A classe só muda a partir do nível 10, por **Reencarnação** (com confirmação): mantém nível, XP e Gold, volta aos atributos da nova classe e libera todos os pontos para redistribuir.
- **Status** (`/personagem`): sprite com seletor de pose, barras, atributos FOR/INT/AGI/VIT com distribuição de pontos pelo teclado e estatísticas vitalícias.
- **HUD** com o busto do herói animado (link para o Status).
- **Visualizador** `/dev/sprites`: todas as combinações de cabelo, cor, pele, olhos e roupas, em qualquer pose, silhueta e escala.
- **Desfazer seguro com atributos**: se um level up for desfeito depois que os pontos já foram distribuídos, os pontos saem do atributo mais alto acima da base da classe.

| Classe | FOR | INT | AGI | VIT | Bônus |
|---|---|---|---|---|---|
| Guerreiro | 8 | 3 | 5 | 6 | +15% XP em Difícil/Épica |
| Mago | 3 | 8 | 5 | 6 | +10% XP |
| Ladino | 5 | 4 | 8 | 5 | +20% Gold |
| Clérigo | 5 | 5 | 4 | 8 | −30% nas penalidades de HP |

### Fase 3 — Progressão

- Concluir uma missão dá **XP e Gold**. Os números flutuantes ("+20 XP", "+6 G", "CRÍTICO!") sobem a partir da caixa marcada, e o aviso mostra a recompensa com "Desfazer".
- **Level up**: HP e MP cheios, +2 pontos de atributo e tela cheia com flash, "LEVEL UP!" e a tabela de ganhos (Nível, HP máx., MP máx., pontos). A tela fecha com Enter ou Esc.
- **Desfazer é seguro**: reabrir uma missão, pelo aviso ou desmarcando a caixa, estorna exatamente XP, Gold, níveis, pontos e o HP/MP curado pelo level up. Também remove a próxima ocorrência ainda intocada de uma missão recorrente. Concluir e reabrir em sequência nunca gera recompensa extra.
- **Log de recompensas** (`rewardLog`, últimos 500 eventos) e contadores vitalícios (`lifetime`: missões concluídas, XP e Gold ganhos, críticos).
- **HUD** com nível, pontos a distribuir, barras de HP/MP/XP em degraus e Gold, que "pula" quando muda.
- **Prévia da recompensa** no painel da missão, com os bônus que estão valendo.

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
- **Store** (`src/store/`): Zustand com `persist` em IndexedDB (`idb-keyval`), estado versionado (v4) e migrações testadas. O modelo de dados fica em `src/store/types.ts`.
- **i18n** (`src/lib/i18n`): pt-BR completo, inglês parcial com fallback.

### Telas (descrição)

- **Criação de personagem**: à esquerda, a prévia no "palco" e a janela da classe (descrição, bônus, atributos iniciais); à direita, o menu com a mãozinha, cada opção com ◂ ▸, amostra de cor e o d20 roxo.
- **Status**: o herói em escala ×6 com botões Parado/Vitória/Desmaiado, barras e, ao lado, Atributos, Estatísticas e Conquistas.
- **Meu Dia (desktop)**:
  - no topo, o HUD azul;
  - à esquerda, o menu principal e o painel de listas (busca, listas inteligentes com contadores, listas do usuário);
  - no centro, o cabeçalho com a data por extenso, o campo "Adicionar uma missão" com a dificuldade e as missões. Cada linha tem alça de arrastar, caixa de seleção pixel, título, detalhes (lista, vencimento, recorrência ↻, passos "0 de 2", tags), pips coloridos de dificuldade e estrela;
  - à direita, o painel de detalhes da missão selecionada.
- **Planejado**: seções "Atrasadas (n)", "Hoje (n)", "Amanhã (n)" etc.
- **Mobile**: o cabeçalho tem um botão ◂ que abre a página de listas. Os detalhes abrem em tela cheia sobre a lista.
- **/dev/ui**: vitrine dos componentes com troca de tema ao vivo.

## Fórmulas

Todas ficam em `src/features/progression/formulas.ts`, como funções puras (a aleatoriedade é injetada) cobertas por testes.

### Recompensa base

| Dificuldade | XP | Gold |
|---|---|---|
| Trivial | 5 | 1 |
| Fácil | 10 | 3 |
| Média | 20 | 6 |
| Difícil | 40 | 12 |
| Épica | 80 | 25 |

### Modificadores (somados)

```
bônus  = passos + pontualidade + sequência
XP     = round(base_xp   × (1 + bônus + classe_xp))
Gold   = max(1, round(base_gold × (1 + bônus + classe_gold) × sorte × crítico))
```

| Modificador | Valor |
|---|---|
| Passos concluídos | +10% cada, máx. +50% |
| Pontualidade (concluída até o dia do vencimento) | +20% |
| Sequência (só diárias) | +2% por dia, máx. +40% |
| Guerreiro | +15% XP em Difícil/Épica |
| Mago | +10% XP |
| Ladino | +20% Gold |
| Clérigo | −30% nas penalidades de HP (Fase 5) |
| Sorte | Gold × uniforme(0,85 – 1,15) |
| Crítico | 5% de chance de Gold ×2 |

Exemplo: missão Média com 2 passos feitos e no prazo → XP = 20 × (1 + 0,2 + 0,2) = 28.

### Dano e desmaio

| Dificuldade | Dano (rotina perdida / hábito −) | Clérigo (−30%) |
|---|---|---|
| Trivial | 1 | 1 |
| Fácil | 3 | 2 |
| Média | 5 | 4 |
| Difícil | 7 | 5 |
| Épica | 10 | 7 |

Desmaio (HP ≤ 0): o XP do nível atual vai a 0, perde `floor(10% do Gold)` e o HP volta ao máximo.

### Níveis

| Fórmula | Definição |
|---|---|
| XP para o próximo nível | `round(25 · n^1.5 + 50)` (nível 1 → 75, nível 10 → 841) |
| Nível máximo | 99 |
| HP máximo | `50 + 5 · nível` |
| MP máximo | `20 + 2 · nível` |
| Pontos por nível | 2 |

O progresso é guardado como nível + XP no nível. Para aplicar ou desfazer, ele é convertido em XP total acumulado. Assim, desfazer várias conclusões em qualquer ordem volta exatamente ao estado inicial, o que é testado como propriedade com sequências aleatórias.
