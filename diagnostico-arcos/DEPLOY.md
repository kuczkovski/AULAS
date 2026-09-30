# Publicar a avaliação diagnóstica

Lista de verificação para colocar a ferramenta no ar. O código está pronto; o que falta é criar o banco e a publicação.

## Estado atual

O projeto Supabase **`diagnostico-arcos`** (`iuexzechpbwjijgrvnzr`, São Paulo) já foi criado, com as migrações `0001` e `0002`
aplicadas e verificadas (o papel público não lê nenhuma tabela e só executa as cinco funções do aluno).
O e-mail `kuczkovski@gmail.com` já está em `professores`. **Faltam**, no painel do Supabase, criar o usuário do professor e
desligar o cadastro livre (itens marcados abaixo) e, na Vercel, criar o projeto.

## 1. Supabase (uma vez)

Crie **um projeto só para esta ferramenta** (os nomes das tabelas são genéricos e podem colidir com outros apps).

- [x] Migrações `0001` e `0002` aplicadas (para outro ambiente: SQL Editor ou `supabase db push`, em ordem).
- [ ] **Authentication → Sign In / Providers → Email**: deixe o login por e-mail e senha ligado e **desligue "Allow new users to sign up"**.
      Os professores são criados por você em **Authentication → Users** (com e-mail confirmado). Sem isso, qualquer pessoa poderia criar uma
      conta com e-mail de professor na lista.
- [ ] Ligue **Prevent use of leaked passwords**.
- [x] (já feito para `kuczkovski@gmail.com`) Autorize o(s) professor(es), no SQL Editor (e-mail em minúsculas):
      `insert into public.professores (email) values ('nome@escola.edu.br');`
- [ ] **Não** ligue "Allow anonymous sign-ins": os alunos não usam o Auth.
- [ ] Confira em **Table Editor** que `attempts`, `answers`, `self_assessment`, `gabarito` e `professores` estão com RLS ligado.

## 2. Vercel

1. **Add New → Project**, repositório `kuczkovski/AULAS`.
2. **Root Directory**: `diagnostico-arcos` (framework detectado: Next.js).
3. **Environment Variables** (Production e Preview):

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://iuexzechpbwjijgrvnzr.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_SPX21GgqNrtSp6TFT2udhg_IAwhW3Kk` (chave pública, pode ficar no navegador) |

   Nunca cadastre a `service_role` nem a senha do banco.
   **Sem essas variáveis o site sobe em modo local** (e o gabarito vai junto no pacote). Confira as variáveis antes de divulgar o endereço.
4. **Deploy**, e depois (opcional) **Settings → Domains** para um subdomínio fácil de digitar.

## 3. Teste de aceite (roteiro, seção 16)

Faça no endereço publicado, em um Chromebook da escola, na rede da escola:

- [ ] Iniciar com nome e turma válidos; o cronômetro marca 60:00 e desce.
- [ ] Responder 3 questões, **atualizar a página**: tudo continua lá e o cronômetro não reiniciou.
- [ ] Desligar o Wi-Fi, responder mais uma e religar: a mensagem de "sem conexão" aparece e some ao reenviar.
- [ ] Fechar a aba e voltar em `/`: aparece "Continuar avaliação".
- [ ] Concluir: a síntese aparece, e voltar a `/avaliacao` leva à síntese (sem editar).
- [ ] `/professor` sem login mostra só a tela de entrada; com login, os dados da tentativa aparecem; o filtro por turma confere.
- [ ] Conferir à mão D1–D4 de um aluno contra a tabela de respostas no painel (Alunos → clicar no nome).
- [ ] Testar com uma conta logada **que não está** em `professores`: deve ver "conta não autorizada".
- [ ] Apagar as tentativas de teste (Alunos → clicar no nome → Apagar esta tentativa).

## 4. Aplicação piloto

Comece com **uma turma**. Observe: alunos que travam em alguma questão, mensagens de conexão, e se os 60 minutos foram adequados
(tempo médio em **Visão geral**). Ajuste antes de liberar as cinco turmas.

## Atualizações

- Mudanças no banco entram como novos arquivos em `supabase/migrations/`; nunca edite uma migração já aplicada.
- Cada push na branch de produção gera um deploy novo; para voltar, **Vercel → Deployments → Promote to Production** em um deploy anterior.
