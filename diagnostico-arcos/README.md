# Diagnóstico — Arcos e Ângulos

Webferramenta diagnóstica do 1º ano do Ensino Médio sobre **relações entre arcos e ângulos na circunferência**,
a partir do *Roteiro único de desenvolvimento e aplicação* e do *Banco de 20 exercícios diagnósticos*. O aluno entra só com nome e turma; o professor
recebe leitura por aluno, turma, questão e habilidade, sem reduzir o diagnóstico a uma nota.

- **Next.js 16** (App Router) + TypeScript + Tailwind 4, publicado na **Vercel**
- **Supabase** (Postgres + RLS + Auth só para o professor)
- Sem Supabase configurado, roda em **modo local** (dados no navegador, painel sem login) para testar a interface

## Como funciona

| Tema | Decisão |
|---|---|
| Aluno sem login | O aluno só fala com o banco por funções (`iniciar_tentativa`, `salvar_resposta`, …). A credencial é o id da tentativa (UUID aleatório guardado no navegador). Nenhuma tabela é legível pelo papel público. |
| Gabarito | Fica na tabela `gabarito`, sem acesso público. **A correção é feita no banco**: o navegador do aluno nunca recebe a resposta certa, nem durante nem depois da prova (ele só vê a síntese por área). |
| Cronômetro | 60 min, contados pela hora do **servidor** (`started_at`), então recarregar ou trocar de aparelho não dá tempo extra. Só começa depois de confirmar nome e turma. |
| Tempo esgotado | O app envia o que falta e chama `finalizar_tentativa`; o banco também fecha sozinho tentativas vencidas (`encerrada_por_tempo`). Questão sem resposta conta como não acertada. |
| Persistência | Cada resposta é gravada ao escolher/avançar. Uma cópia local + fila de pendências tolera quedas de conexão e recarregamento; o reenvio é automático (ao voltar a rede e a cada 8 s). |
| Tentativas repetidas | Só pode haver **uma em andamento** por nome + turma (índice único). Quem tenta de novo vê "Continuar avaliação". Nova tentativa depois de concluir é permitida e **sinalizada** no painel (análise usa a finalizada mais recente; nada é apagado sozinho). |
| Professor | E-mail e senha (Supabase Auth); só e-mails da tabela `professores` leem os dados (RLS). |

### Limite conhecido

Sem login, não dá para impedir duplicidade com segurança absoluta. Quem digitar o nome e a turma de um colega
**com a prova em andamento** e clicar em "Continuar avaliação" assume aquela tentativa. É o compromisso do roteiro
(seção 10.1); em sala, a aplicação é supervisionada. Tentativas concluídas nunca são reabertas.

## Questões e dimensões

20 questões (16 de múltipla escolha e 4 numéricas), com figuras em SVG nas questões que precisam delas:
D1 = Q1–Q5 (linguagem geométrica), D2 = Q6–Q10 (circunferência), D3 = Q11–Q15 (ângulos e rotações),
D4 = Q16–Q20 (frações da volta e ponte para o arco). O documento original tem uma D5 (Q19–Q20, integração arco × ângulo);
ela foi incorporada à D4. Q19 e Q20 antecipam conteúdo novo, e o painel avisa que resultado baixo nelas não indica deficiência.
As interações de clicar na figura e arrastar termos ficaram como múltipla escolha com figura, alternativa prevista no documento.

## Estrutura

```
src/dominio/     Questões (sem gabarito), gabarito (só testes/modo local), régua D1–D4
src/lib/         Backends (Supabase/local), fila offline, análise do painel, CSV
src/components/  Figuras SVG, cronômetro, contexto e elementos visuais do painel
src/app/         / · /avaliacao · /autoavaliacao · /concluido · /professor/{turmas,alunos,questoes,habilidades}
supabase/migrations/0001_diagnostico.sql   Tabelas, funções, RLS e gabarito
```

## Rodando

```bash
npm install
npm run dev          # http://localhost:3000, modo local
npm test             # domínio, análise, fila offline e migração (PGlite)
npm run typecheck
```

Em modo local, abra `/professor` e use **Gerar dados de demonstração** para ver o painel com cinco turmas.

Para usar o Supabase, copie `.env.example` para `.env.local` e siga o [DEPLOY.md](DEPLOY.md).

## Mudando as questões

O gabarito existe em **dois lugares**: `supabase/migrations/0001_diagnostico.sql` (oficial) e
`src/dominio/gabarito.ts` (testes). O teste `migracao.test.ts` confere que o banco e o app concordam
(enunciados/opções em `questoes.ts`, respostas e habilidades). Para alterar uma questão depois de publicada, crie uma
**nova migração** que atualize `gabarito`; nunca edite uma migração já aplicada.
