# QuestLog — app de tarefas com RPG 16-bit

Especificação do produto. Siga-a fase a fase (seção 10). Ao terminar cada fase: `npm run build` + `npm test`, commit, e resumo do que foi feito e como testar.

## Convenções do código

- Vite + React 18 + TypeScript strict; Zustand (persist em IndexedDB via `idb-keyval`); Tailwind v4 (`@tailwindcss/vite`) + CSS custom em `src/ui/ui.css`.
- Textos da interface sempre via `t('chave')` (`src/lib/i18n`), nunca strings soltas em componentes.
- Cores somente de `src/ui/palette.ts` / variáveis CSS de tema (`--win-top`, `--win-bottom`, ...). Nada de gradientes fora das janelas.
- Componentes do design system em `src/ui/` (`Window`, `Button`, `Bar`, `Cursor`, `Dialog`, `Tabs`, `Menu`). Navegação por teclado via `useMenuNavigation`.
- Store: `src/store/`. Toda mudança de formato do estado persistido incrementa `STORE_VERSION` e ganha um passo em `migrations.ts` com teste.
- Fórmulas de jogo: funções puras em `src/features/progression/formulas.ts`, com testes.
- Nenhum asset de terceiros: pixel art gerada em código (`src/sprites/`), áudio via Web Audio.

---

## 1. Visão geral

Aplicativo web de gerenciamento de tarefas no estilo do **Microsoft To Do** (listas, "Meu Dia", importantes, planejadas, subtarefas, datas, recorrência), combinado com a **gamificação do Habitica**: concluir tarefas dá **XP** e **Gold**, o personagem **sobe de nível**, e o Gold é gasto numa **loja de itens cosméticos**.

Identidade visual evocando **JRPGs de 16 bits da era SNES**: janelas de menu com gradiente azul e borda chanfrada, fonte pixelada, sprites em pixel art, cursor de "mãozinha" piscando, sons chiptune. **Todos os assets devem ser originais.**

Idioma: **português do Brasil**, estruturado com i18n para permitir inglês depois.

## 2. Stack técnica

- Vite + React 18 + TypeScript (strict)
- Zustand com `persist` em IndexedDB (`idb-keyval`) — 100% offline, sem backend
- Tailwind CSS + CSS custom para as janelas estilo SNES
- Framer Motion (level up, dano, moedas voando)
- date-fns (pt-BR) para datas e recorrência
- Web Audio API para efeitos chiptune procedurais
- PWA (`vite-plugin-pwa`)
- Vitest + Testing Library
- Fontes pixel open source: "Press Start 2P" (títulos) e "VT323" (textos longos) — empacotadas via @fontsource para funcionar offline

Estrutura:

```
src/
  app/            # rotas, layout, providers
  features/
    tasks/        # listas, tarefas, subtarefas, recorrência
    character/    # criação, atributos, sprite, equipamento
    progression/  # XP, níveis, gold, fórmulas, conquistas
    shop/         # catálogo, compra, inventário
    audio/        # sintetizador chiptune
  ui/             # design system 16-bit
  sprites/        # pixel art definida em código (matrizes + paletas)
  store/          # stores Zustand + migrações
  lib/            # utilitários, i18n
```

## 3. Tarefas (estilo Microsoft To Do)

### Listas inteligentes
- **Meu Dia** — tarefas marcadas para hoje (reseta à meia-noite, com sugestões de atrasadas/planejadas)
- **Importante** — com estrela
- **Planejado** — com data, agrupadas em Atrasadas / Hoje / Amanhã / Esta semana / Depois
- **Todas** e **Concluídas**

### Listas personalizadas
- Criar, renomear, excluir, reordenar (drag and drop), ícone pixel e cor
- Agrupar listas em grupos (pastas)

### Tarefa
- Título, notas, subtarefas, vencimento, lembrete (Notification API), recorrência (diária, dias úteis, semanal com dias, mensal, anual, a cada N dias)
- Dificuldade: Trivial, Fácil, Média, Difícil, Épica
- Importante, Meu Dia, tags
- Ordenação: manual, data, importância, dificuldade, alfabética
- Busca global
- Concluir com um clique; desfazer (toast 5s, estorna XP/Gold)

### Tipos de missão
- **To-dos (Missões)** — únicas
- **Diárias (Rotinas)** — recorrentes; não concluídas até o fim do dia → perde HP
- **Hábitos** — botões + / − várias vezes ao dia

## 4. Sistema de RPG

- Nível, XP, HP (máx. 50 + 5/nível), MP, Gold; atributos FOR, INT, AGI, VIT

| Dificuldade | XP | Gold |
|---|---|---|
| Trivial | 5 | 1 |
| Fácil | 10 | 3 |
| Média | 20 | 6 |
| Difícil | 40 | 12 |
| Épica | 80 | 25 |

Modificadores: subtarefas +10% cada (máx. +50%); pontualidade +20%; streak em diárias +2%/dia (máx. +40%); bônus de classe; Gold ±15% aleatório; 5% de drop crítico (Gold ×2).

Curva: `xpParaProximoNivel(n) = round(25 * n^1.5 + 50)`, nível máx. 99. Level up: HP cheio, pontos de atributo, animação em tela cheia com jingle.

Penalidades (desligáveis): diária não feita −HP (Trivial 1 … Épica 10). HP 0 → desmaio: XP volta ao início do nível e −10% Gold; tela de Game Over com "Continuar". Processamento na primeira abertura do dia ("Relatório da noite").

Conquistas: ≥ 15 com medalha pixel.

## 5. Criação de personagem

Menu JRPG com preview ao vivo (idle 2 frames). Nome (≤12), Classe (Guerreiro +15% XP em Difícil/Épica, FOR; Mago +10% XP, INT; Ladino +20% Gold, AGI; Clérigo penalidades −30%, VIT), corpo (2), pele (8), cabelo (10 estilos × 12 cores), olhos (6), roupa inicial (3 por classe), botão "Aleatório" (d20 animado). Classe só muda no nível 10 via "Reencarnação".

Sprites procedurais: camadas 32×32 com índices de paleta, `<canvas>` com `imageSmoothingEnabled = false`, escala inteira. Idle, vitória, desmaiado. Visualizador em `/dev/sprites`.

## 6. Loja de cosméticos

NPC vendedor original com diálogo digitado. Abas: Chapéus, Roupas, Armas, Acessórios, Pets, Fundos, Temas de janela. Item: nome, descrição, preço, raridade (Comum/Incomum/Raro/Épico/Lendário), nível mínimo. Preview, confirmação "Comprar por 120G? Sim/Não", moedas + som. Inventário/equipamento com slots. Poção de Vida (15 HP, 25G). Oferta do dia: 4 itens −20% (seed pela data). ≥ 40 itens em `features/shop/catalog.ts`. Temas: Azul Clássico, Pergaminho, Floresta, Lava, Noite Estrelada. Fundos em canvas com paralaxe.

## 7. Direção de arte e UI

- Janelas: gradiente vertical (`#3a4fb8` → `#10186b`), borda dupla chanfrada, componente `<Window>` que respeita o tema
- Cursor mãozinha oscilando; navegação completa por teclado (setas, Enter, Esc)
- Barras HP (verde→amarelo→vermelho), MP (azul), XP (dourado) com preenchimento em degraus
- Números flutuantes, tremida de tela ao sofrer dano
- Transições mosaico/fade em faixas
- HUD fixo no topo
- Paleta em `ui/palette.ts`; `image-rendering: pixelated`
- Responsivo: sidebar no desktop, abas inferiores no mobile (Missões / Personagem / Loja / Menu)
- Acessibilidade: contraste AA, fonte legível opcional, `prefers-reduced-motion`, ARIA
- Áudio: onda quadrada/triangular/ruído; volume e mute; só após interação

## 8. Outras telas

Status do personagem; Configurações (som, penalidades, fonte legível, início da semana, virada do dia, exportar/importar JSON, resetar com confirmação dupla); Onboarding com mentor NPC.

## 9. Modelo de dados

Ver `src/store/types.ts`. Manter log de eventos de recompensa (tarefa, XP, Gold, data) para desfazer e estatísticas.

## 10. Fases

1. **Fundação** — Vite/TS, Tailwind, design system 16-bit, paleta, fontes, roteamento, store com persistência
2. **Tarefas** — listas, listas inteligentes, CRUD, subtarefas, datas, recorrência, busca, drag and drop
3. **Progressão** — fórmulas com testes, XP/Gold, desfazer, níveis, HUD, números flutuantes, level up
4. **Personagem** — sprites em camadas, criação, status, distribuição de pontos
5. **Diárias e hábitos** — virada de dia, penalidades, desmaio, relatório da noite
6. **Loja e inventário** — catálogo, NPC, compra, preview, equipar, ofertas, temas, fundos
7. **Polimento** — áudio, transições, conquistas, onboarding, PWA, acessibilidade, mobile, exportar/importar

## 11. Critérios de aceite

- 100% offline; dados sobrevivem a recarregar
- Concluir/desfazer nunca deixa XP/Gold inconsistentes (testado)
- Fórmulas puras com testes
- Navegável por teclado
- Sem assets de terceiros
- Lighthouse: PWA instalável, acessibilidade ≥ 90
- README com instruções, screenshots descritos e fórmulas
