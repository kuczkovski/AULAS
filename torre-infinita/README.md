# Torre Infinita 2.0

Treino adaptativo de matemática para o **Fundamental 2 (6º ao 9º ano)**. Reconstrução do jogo de tabuada
original: em vez de um único tipo de conta, o jogo descobre o que o aluno já sabe e treina o que falta,
em 24 habilidades que seguem a progressão do 6º ao 9º ano.

- **Next.js 16** (App Router) + React 19 + Tailwind 4, publicado na **Vercel**
- **Supabase** (Postgres + Auth anônimo + RLS) para turmas, progresso, placar e painel do professor
- Funciona **sem Supabase**: o progresso fica no navegador (modo local)

## O que mudou em relação à versão 1

| Antes | Agora |
|---|---|
| Só soma, subtração e tabuada até 12 | 30 habilidades: frações, inteiros, porcentagem, proporção, equações, potências, raízes, Pitágoras, estatística |
| O conteúdo dependia do nível de XP | O conteúdo abre por **domínio**: uma habilidade só libera as seguintes quando o aluno a domina |
| Começava do zero para todos | **Nivelamento** adaptativo de poucos minutos, com respostas digitadas |
| Só múltipla escolha | Escolha, **digitar a resposta**, verdadeiro/falso, **ordenar**, **posicionar na reta numérica** e **encontre o erro** |
| Explicação só no modo "Assistido" | **Dica e explicação para todos**; erro volta como reforço com números novos |
| Cronômetro que chegava a 3 s | Sem cronômetro; rapidez só rende bônus, nunca punição |
| Placar premiava tempo de jogo | **Placar de evolução** (cada aluno contra o próprio histórico), placar de pontos com teto diário, meta coletiva da turma e apelidos moderados |
| Sem visão do professor | Dados de domínio por aluno no Supabase (painel do professor: próxima etapa) |

## Estrutura

```
src/engine/        Motor pedagógico (TypeScript puro, sem React)
  habilidades/     Geradores de perguntas por habilidade (base6, fracoes, ano7, ano89)
  dominio.ts       Modelo de domínio por categoria (acerto recente + rapidez, com encolhimento)
  selecao.ts       Desbloqueio por pré-requisitos, sorteio ponderado, repetição espaçada
  nivelamento.ts   Teste de nivelamento adaptativo
  rodada.ts        Regras de uma rodada: vidas, pontos, reforço, XP, modo guiado
src/components/    Telas: entrada, personagem, nivelamento, mapa, rodada, resultado
src/lib/           Supabase, armazenamento local e fila offline, sons
supabase/migrations/0001_init.sql   Esquema, RLS e funções
```

### Como adicionar uma habilidade

Crie um objeto `Habilidade` em `src/engine/habilidades/` e registre-o em `index.ts` (a ordem deve respeitar
os requisitos). Ele declara `categorias` (a unidade do modelo de domínio) e `gerar({ r, cat, digitar })`, que devolve
enunciado, resposta, alternativas, dica e explicação. O teste `habilidades.test.ts` valida sozinho toda habilidade
nova (resposta presente e única entre as alternativas, sem `NaN`, dica e explicação preenchidas).

## Rodando

```bash
npm install
npm run dev          # http://localhost:3000, em modo local
npm test             # motor + migração do banco (PGlite)
npm run typecheck
```

## Supabase

O projeto de produção é `torre-infinita` (ref `reoekaxhwabdopgaznni`, região `sa-east-1`), com as migrações
`0001`, `0002` e `0003` já aplicadas. Para criar outro ambiente:

1. Crie um projeto e, em **Authentication → Sign In / Providers**, ative **Allow anonymous sign-ins** (os alunos entram assim).
2. Aplique as migrações de `supabase/migrations/` em ordem (`0001` a `0003`), pelo SQL Editor ou `supabase db push`.
3. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Crie o usuário do professor em **Authentication → Users** (e-mail e senha).

### Cadastrar uma turma (até o painel do professor ficar pronto)

No SQL Editor, com o `id` do usuário professor:

```sql
insert into turmas (professor_id, nome, ano) values ('<uuid-do-professor>', '7º A', 7) returning id;
```

Depois, importe os alunos. A função gera um PIN de 4 dígitos por aluno e o devolve **uma única vez**
(só o hash fica guardado); imprima os cartões com código e PIN:

```sql
-- executar como o professor: no SQL Editor use "set local role authenticated" com o claim do professor,
-- ou chame a função pelo cliente supabase-js logado como professor.
select * from professor_importar_alunos('<uuid-da-turma>',
  '[{"codigo":"e2700573","nome":"Ana Souza"},{"codigo":"e2700574","nome":"Bruno Lima"}]');
```

### Segurança

- Nome real e código do aluno só o professor vê. O placar (`placar_turma()`) expõe apenas apelido, avatar e pontos.
- PIN individual com hash (bcrypt) e **bloqueio de 10 minutos após 5 erros**.
- Apelidos passam por filtro no servidor (`palavras_bloqueadas`, editável).
- A pontuação de uma rodada tem teto (`check` na tabela) e o servidor decide turma e semana.
- Tudo isso é verificado por `src/db/migracao.test.ts`, que roda a migração num Postgres em memória.

Limite conhecido: a pontuação é calculada no navegador. O teto por rodada e o teto diário do placar reduzem o
estrago de quem forjar dados, mas não o eliminam. Para competições valendo nota, mova o cálculo para uma função no servidor.

## Publicar na Vercel

Crie um projeto novo apontando para este repositório com **Root Directory = `torre-infinita`** (framework: Next.js).
Configure as duas variáveis do Supabase em *Settings → Environment Variables*. O `vercel.json` da raiz do repositório
continua publicando as outras aulas; este app é um projeto separado.

## Placar de evolução

O placar de pontos favorece quem já joga muito e quem já sabe mais. O **placar de evolução** (`0003_placar_evolucao.sql`)
compara cada aluno com o próprio histórico, e é a aba que abre por padrão. Nota de 0 a 100 por semana:

| Parte | Peso | Como é calculada |
|---|---|---|
| Esforço | até 50 | pontos da semana ÷ média das últimas 4 semanas do aluno (referência mínima de 300; acima de 150% não rende mais) |
| Precisão | até 20 | melhora do acerto sobre o histórico (sem histórico, vale o acerto da semana) |
| Constância | até 30 | 6 pontos por dia jogado, no máximo 5 dias |

- Os pontos de cada dia seguem o teto de 2.000, então maratona não compensa.
- O aluno vê o detalhe só da própria nota (`placar_evolucao()` esconde o dos colegas). O professor vê todas as notas
  na tabela de alunos (`professor_evolucao()`).
- O cálculo fica no servidor (`evolucao_calc`, sem acesso pela API) e é coberto por `src/db/migracao.test.ts`, com
  histórico de semanas anteriores e contas conferidas à mão.
- Limite conhecido: quem joga pouco por 4 semanas e depois muito eleva a própria nota. O piso de 300 e o teto de
  150% reduzem esse efeito; o risco é baixo porque a nota não vale nada além do placar.

## Formatos de desafio

| Formato | Como funciona | Exemplo |
|---|---|---|
| `escolha` | Marcar uma alternativa (atalhos 1 a 4) | Tabuada, porcentagem |
| `digitar` | Teclado na tela, sem alternativas; só aparece depois que o aluno domina a categoria | Somas, equações |
| `vf` | Verdadeiro ou falso | Divisibilidade |
| `ordenar` | Tocar nos itens na ordem certa | Frações e decimais |
| `reta` | Tocar (ou usar as setas) na reta numérica | Frações e inteiros na reta |
| `escolha` + `linhas` | "Encontre o erro" numa resolução em linhas | Equação do 1º grau, ordem das operações |

As habilidades com toque, leitura crítica e problemas do dia a dia (`formatos.ts`) ficam fora do nivelamento,
que é só de respostas digitadas, e entram na prática quando os requisitos abrem. Formatos novos exigem também
um componente em `PerguntaView` e uma regra em `resposta.ts`.

## App instalável (PWA)

- `src/app/manifest.ts` e ícones em `public/icons` (gerados por `scripts/gerar-icones.mjs`).
- `public/sw.js`: páginas com rede primeiro e cópia para offline; arquivos com hash em cache; chamadas ao Supabase
  não são interceptadas. O app guarda os arquivos carregados na primeira visita, então abre offline desde a primeira vez.
- Offline, o aluno continua jogando: rodadas ficam numa fila local e são enviadas quando a internet volta.
- Em "Ajustes" aparece **Instalar o app** (Chrome/Android) ou a instrução para iPhone/iPad.
- O service worker só é registrado em produção (`next build && next start`), nunca em `next dev`.
  Para publicar uma mudança que exija limpar cópias antigas, aumente `VERSAO` em `public/sw.js`.

## Próximas etapas

- Painel do professor (`/professor`): login, criar turma, importar alunos e imprimir cartões, mapa de calor de habilidades,
  alunos travados e ausentes, meta semanal, exportação CSV.
- Mais problemas com contexto (7º ao 9º ano) e arrastar-e-soltar.
- Zonas temáticas com chefes próprios e mais itens de personagem.
