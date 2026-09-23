# Geometria em Quadrinhos — Quadriláteros Notáveis

Quadro digital interativo para uma aula expositiva de **50 minutos** sobre quadriláteros notáveis (Ensino Fundamental II), pensado para o professor conduzir a aula com um **tablet ligado ao projetor**.

Não é uma sequência de slides: cada tela é uma unidade de aprendizagem com **figuras geométricas construídas por coordenadas** (SVG), **revelação progressiva** controlada pelo professor e **manipulação de vértices** que preserva as propriedades de cada figura (paralelogramo continua paralelogramo, trapézio isósceles continua isósceles etc.).

## Como usar em sala

### Opção 1 — arquivo único (offline, sem instalação)
Abra **`aula-quadrilateros.html`** no Chrome ou no Samsung Internet. O arquivo contém tudo (fontes, fórmulas, figuras) e funciona sem internet.

### Opção 2 — aplicativo instalável (PWA)
Publique a pasta `dist/` (gerada por `npm run build`) em qualquer servidor estático (por exemplo, GitHub Pages). Abra o endereço uma vez com internet e use **“Adicionar à tela inicial”**: depois disso a aplicação funciona offline e abre em tela cheia.

## Os dois modos

| | Modo projeção (alunos) | Modo professor |
|---|---|---|
| Mostra | Só o quadro 16:9 com o conteúdo revelado até o momento | Quadro + painel de apoio + barra de controles |
| Painel | — | Objetivo, tempo previsto, conhecimentos prévios, orientações, perguntas, justificativas, dificuldades, relação com a avaliação, lista de revelações (toque para ir) |
| Cronômetro | Oculto | Tempo total, tempo na tela e “adiantado/atrasado” em relação ao plano |
| Controles | Barra flutuante mínima, que fica quase transparente após 3 s | Barra completa |

**Tablet espelhado no projetor** (o caso mais comum): tudo o que aparece no tablet é projetado. Use o **Modo professor** para preparar a aula e o **Modo projeção** durante a aula. Para ter as orientações à mão, imprima o **Roteiro** (botão “Roteiro” → Imprimir/salvar PDF), que traz a sequência de toques e as notas de cada tela.

**Tela estendida** (quando o dispositivo permite duas telas independentes): toque em **“Janela do professor”**. Abre-se uma segunda janela com o painel; a janela original passa ao modo projeção. As duas ficam sincronizadas (navegação, figuras manipuladas e anotações).

## Controles

- **Próximo / Anterior**: avançam ou voltam uma revelação; no fim da tela passam para a próxima (ou para o fim da anterior).
- **Reiniciar etapa**: volta a tela ao estado inicial; se houver anotações, pergunta se devem ser mantidas ou limpas.
- **Menu**: acesso direto a qualquer tela, por bloco ou por tema (triângulos e ângulos, retas paralelas, bissetriz, quadriláteros, trapézios, paralelogramos, base média, mediana da hipotenusa, problemas).
- **Anotar**: caneta, destaque de segmento, círculo, texto, borracha, desfazer e limpar tudo. As anotações ficam associadas à tela.
- **Alças laranja** nas figuras: arraste para manipular a construção.

Teclado (ou passador de slides): `→` `espaço` `PageDown` avançam · `←` `PageUp` voltam · `Shift+setas` ou `↑`/`↓` trocam de tela · `M` menu · `R` reiniciar · `A` anotar · `P` alterna o modo · `F` tela cheia · `Esc` fecha.

## Estrutura da aula

| Bloco | Conteúdo | Duração | Telas |
|---|---|---|---|
| 1 | Conhecimentos prévios | 8 min | Abertura · 1 Soma dos ângulos do triângulo · 2 Suplementares · 3 Paralelas e transversal · 4 Bissetriz · 5 Triângulo isósceles |
| 2 | Reconhecimento dos quadriláteros | 10 min | 6 Elementos · 7 Ângulos internos · 8 Ângulos externos · 9 Trapézio · 10 Paralelogramo · 11 Retângulo, losango e quadrado |
| 3 | Propriedades e relações | 12 min | 12 Trapézio isósceles · 13 Paralelogramo · 14 Base média do trapézio · 15 Base média do triângulo (e pontos médios de um quadrilátero) · 16 Mediana relativa à hipotenusa · 17 Bissetriz e triângulo isósceles |
| 4 | Aplicação orientada | 15 min | Problema 1 (ângulos) · Problema 2 (trapézio + Pitágoras) · Problema 3 (paralelogramo com bissetriz) |
| 5 | Verificação da aprendizagem | 5 min | Base média de um trapézio isósceles (18 cm e 10 cm) |

## Desenvolvimento

Requisitos: Node 20+.

```bash
npm install
npm run dev           # servidor de desenvolvimento
npm run build         # PWA em dist/
npm run build:single  # arquivo único aula-quadrilateros.html
npm run typecheck
```

Tecnologias: React + TypeScript, Tailwind CSS, SVG, Framer Motion, Lucide, KaTeX (fórmulas renderizadas localmente), vite-plugin-pwa. Não há backend.

```
src/
  geo/math.ts          geometria plana (vetores, interseções, ângulos, construções)
  geo/svg.tsx          primitivas SVG e marcações convencionais (traços, setas, arcos, ângulo reto, alças)
  state/store.ts       estado da aula, sincronizado entre janelas (BroadcastChannel) e salvo localmente
  lesson/blocks.ts     os 5 blocos e seus tempos
  lesson/screens/*.tsx as telas de cada bloco, com etapas de revelação e notas do professor
  ui/                  palco 16:9, painel do professor, menu, anotações, roteiro impresso
```

Cada tela é um `ScreenDef` com `steps` (descrição de cada revelação), `Component` (renderiza a figura em função de `step`) e `notes` (painel do professor). Para criar uma tela nova, acrescente um objeto ao array do bloco correspondente.
