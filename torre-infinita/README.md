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
| Só soma, subtração e tabuada até 12 | 24 habilidades: frações, inteiros, porcentagem, proporção, equações, potências, raízes, Pitágoras, estatística |
| O conteúdo dependia do nível de XP | O conteúdo abre por **domínio**: uma habilidade só libera as seguintes quando o aluno a domina |
| Começava do zero para todos | **Nivelamento** adaptativo de poucos minutos, com respostas digitadas |
| Só múltipla escolha | Escolha, **digitar a resposta** (teclado na tela) e verdadeiro/falso |
| Explicação só no modo "Assistido" | **Dica e explicação para todos**; erro volta como reforço com números novos |
| Cronômetro que chegava a 3 s | Sem cronômetro; rapidez só rende bônus, nunca punição |
| Placar premiava tempo de jogo | Placar semanal com **teto diário**, meta coletiva da turma e apelidos moderados |
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

1. Crie um projeto e, em **Authentication → Providers**, ative **Anonymous sign-ins** (os alunos entram assim).
2. Rode `supabase/migrations/0001_init.sql` no SQL Editor (ou `supabase db push`).
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

## Próximas etapas

- Painel do professor (`/professor`): login, criar turma, importar alunos e imprimir cartões, mapa de calor de habilidades,
  alunos travados e ausentes, meta semanal, exportação CSV.
- PWA (instalável e offline) e ranking por evolução pessoal.
- Mais formatos: reta numérica interativa, ordenar frações, encontre o erro, problemas com contexto.
- Zonas temáticas com chefes próprios e mais itens de personagem.
