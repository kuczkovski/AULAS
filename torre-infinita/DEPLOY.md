# Publicar a Torre Infinita

Lista de verificação para colocar o jogo no ar. Tempo estimado: 15 minutos.
O código já está pronto: o banco de produção existe e tem as migrações `0001` a `0004` aplicadas.

## 1. Supabase (uma vez)

Projeto de produção: `torre-infinita` (`reoekaxhwabdopgaznni`, São Paulo).

- [ ] **Authentication → Sign In / Providers → Allow anonymous sign-ins**: ligado (os alunos entram assim).
- [ ] **Authentication → Users**: existe o usuário do professor (e-mail e senha), com e-mail confirmado.
- [ ] **Authentication → Sign In / Providers → Email → Prevent use of leaked passwords**: ligado.
- [ ] **Professores autorizados**: só e-mails da tabela `professores` conseguem criar turmas (migração `0004`).
      O seu e-mail já está cadastrado. Para autorizar mais um professor, no SQL Editor:
      `insert into public.professores (email) values ('nome@escola.edu.br');` (sempre em minúsculas).
- [ ] **Obrigatório: Authentication → Rate Limits → Anonymous sign-ins**. O padrão do Supabase é **30 por hora por IP**, e uma
      turma inteira costuma sair pelo mesmo IP da escola: com 30 alunos você bate exatamente no limite, e qualquer tentativa a mais
      recebe erro 429. Aumente para **300** ou mais. O app já evita gastar logins à toa (trocar de aluno no mesmo computador
      reaproveita a sessão), mas a primeira entrada de cada aparelho conta.

## 2. Vercel

1. **Add New → Project** e escolha o repositório `kuczkovski/AULAS`.
2. **Root Directory**: `torre-infinita`. O framework é detectado como Next.js; não mude os comandos.
3. **Environment Variables** (Production e Preview):

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://reoekaxhwabdopgaznni.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave `sb_publishable_...` de **Project Settings → API Keys** |

   São chaves públicas (o navegador as vê). **Nunca** cadastre a `service_role` nem a senha do banco.
4. **Deploy**. O endereço que a Vercel gerar é o que os alunos abrem.
5. Opcional: **Settings → Domains** para um endereço mais fácil de digitar.

O `vercel.json` da raiz do repositório continua publicando as outras aulas em outro projeto; este é separado.

## 3. Depois do deploy

- [ ] Abra o endereço no Chrome: a tela de entrada aparece, e **Ajustes → Instalar o app** funciona.
- [ ] Entre em `/professor` com o seu e-mail e senha.
- [ ] Crie a turma (nome, ano, meta semanal) e **importe os alunos** (`código;nome`, um por linha).
- [ ] **Imprima os cartões de PIN** antes de sair da tela: os PINs aparecem uma única vez.
- [ ] **Teste como aluno** em um computador da escola, na rede da escola: entre com um código e PIN, faça o nivelamento e uma rodada, e
      confirme em `/professor` que os pontos aparecem. Este é o teste que ainda não foi feito de ponta a ponta num navegador real.
- [ ] Apague o aluno de teste (ou use um código de teste da turma piloto).

## 4. Turma piloto

Comece com **uma turma**, por uma semana. Observe:

- alunos que travam no nivelamento ou nas primeiras rodadas (aba **Visão geral → Precisam de atenção**);
- dificuldades da turma (**Onde a turma mais tropeça**) para orientar a aula seguinte;
- se o cartão de PIN foi suficiente ou se muitos alunos precisaram de reset (**Alunos e PINs → Novo PIN**).

## Atualizações e reversão

- Cada envio para a branch de produção gera um deploy novo. Se algo der errado, **Vercel → Deployments → Promote to Production** volta a um deploy anterior.
- Mudanças no banco entram como novos arquivos em `supabase/migrations/` (nunca edite uma migração já aplicada) e são aplicadas pelo SQL Editor ou `supabase db push`.
- Se uma versão nova exigir limpar os arquivos guardados no navegador dos alunos, aumente `VERSAO` em `public/sw.js`.

## Limites conhecidos

- A pontuação é calculada no navegador. O banco limita cada rodada e cada dia, mas um aluno determinado pode forjar pontos dentro desses tetos.
- Os PINs têm 4 dígitos, com bloqueio de 10 minutos depois de 5 erros por código. Isso protege contra tentativas em massa em um único código,
  não contra quem tenta os mesmos PINs comuns em muitos códigos. Para turmas menores e de risco baixo é aceitável; se virar problema,
  troque para PINs de 6 dígitos.
- Sem internet o jogo continua, e as rodadas são enviadas quando a conexão volta. O login por código exige internet.
