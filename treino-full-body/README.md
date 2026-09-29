# Treino Full Body — PWA

Aplicação web responsiva e instalável (PWA) para acompanhar um programa **Full Body de quatro dias por semana**, com sessões de aproximadamente 60 minutos. O foco é força, desenvolvimento muscular equilibrado, membros superiores e estabilidade abdominal.

O app acompanha **somente a evolução individual**. Ele não tem metas estéticas, percentual de gordura, restrições alimentares, comparações com outras pessoas nem rankings.

## Organização semanal

| Dia | Sessão | Ênfase |
| --- | --- | --- |
| Segunda | Full Body A | Peitoral, costas e abdômen |
| Terça | Full Body B | Ombros, braços e pernas |
| Quarta | — | Recuperação |
| Quinta | Full Body C | Costas, peitoral e abdômen |
| Sexta | Full Body D | Ombros, braços e pernas |
| Sábado e domingo | — | Recuperação |

Todas as sessões trabalham o corpo inteiro, com 8 exercícios e cerca de 54–58 minutos estimados (séries mais descanso). A distribuição de exercícios e de intensidade varia entre os dias. Séries, faixas de repetições, descanso, RIR e o próprio exercício de cada posição podem ser editados em **Programa**.

## Funcionalidades

- **Hoje**: mostra o treino do dia (ou o dia de recuperação), a semana com as sessões já concluídas e um botão para retomar a sessão em andamento.
- **Tela de treino**:
  - nome do exercício e demonstração visual (mapa muscular de frente e costas, pontos de execução e mídia opcional);
  - séries planejadas e carga da última sessão;
  - campos grandes para carga, repetições e RIR, com botões de conclusão por série;
  - cronômetro de descanso (±15 s, som e vibração), que continua correndo após recarregar a página;
  - indicador de progresso e navegação entre exercícios;
  - botões para substituir exercício, registrar desconforto e encerrar a sessão.
- **Sem cargas automáticas**: nenhum campo de carga é preenchido sozinho. A carga anterior aparece apenas como referência e como atalho que você toca se quiser usar.
- **Progressão dupla**: quando todas as séries atingem o limite superior da faixa, o app indica que você *pode avaliar* uma progressão gradual, desde que mantenha a técnica e a recuperação. Você registra a sua decisão (manter, avaliar progressão ou reduzir); a carga nunca muda automaticamente.
- **Substituições**: só aparecem alternativas previamente cadastradas. O histórico registra o exercício planejado, o exercício executado e o motivo da troca.
- **Desconforto e interrupção**: você registra região, intensidade de 0 a 10, características (pontual, persistente, irradiada, piorando) e o que fazer em seguida: continuar, pular o exercício ou interromper a sessão. Dor persistente, irradiada, em piora ou de intensidade ≥ 7 exibe um aviso para procurar avaliação profissional. O app não recomenda exercícios como seguros para condições médicas.
- **Histórico e indicadores**: sessões realizadas, frequência semanal, tempo médio, volume por grupo muscular (séries e carga × repetições), evolução de carga e repetições por exercício (gráficos com opção de tabela), registros de desconforto e detalhes de cada sessão.
- **Catálogo**: 63 exercícios com grupo muscular, grupos auxiliares, equipamento, faixa padrão, descanso, RIR, observações de execução e alternativas recíprocas. Você também pode cadastrar exercícios próprios.
- **Perfil**: nome, unidade (kg/lb), incremento dos botões +/−, som e vibração, conta e sincronização, exportação e importação de backup em JSON.

## Tecnologia e arquitetura

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**, com exportação estática (`output: "export"`).
- **IndexedDB (Dexie)** como fonte de verdade local. Toda gravação acontece primeiro no aparelho, então os registros são preservados ao atualizar ou fechar o app, mesmo offline. Os valores digitados em uma série ainda não concluída ficam salvos como rascunho.
- **Supabase** (Auth + Postgres com RLS) para conta e sincronização entre aparelhos. É **opcional**: sem as variáveis de ambiente, o app funciona em modo local.
- **Sincronização offline-first**: cada alteração entra numa fila (`outbox`). O envio é um upsert em lote e o recebimento é incremental por cursor (`server_updated_at`). Conflitos seguem a regra "a última gravação vence", aplicada no cliente e no banco por um trigger que ignora gravações mais antigas. A sincronização roda ao entrar na conta, ao voltar a conexão, ao reabrir o app, a cada 5 minutos e logo após alterações locais.
- **Service worker próprio** (`scripts/sw-template.js`): pré-armazena todo o build estático, o que permite abrir qualquer tela offline. Uma nova versão só é aplicada quando o usuário toca em "Atualizar", nunca no meio de um treino.
- **Validação** com Zod em todas as entradas (séries, prescrições, exercícios, desconforto e perfil) e tratamento de erros de armazenamento, sincronização e autenticação com mensagens em português.

```
src/
  app/                    rotas: / (Hoje), /treino, /programa, /historico, /perfil
  components/             componentes reutilizáveis (ui, gráficos, mapa corporal, cronômetro…)
    training/             tela de treino, editor de série, painéis de substituição/desconforto/encerramento
  data/catalog.ts         catálogo de exercícios e treinos A–D (sem cargas)
  lib/
    types.ts              modelo de dados
    db.ts, repo.ts        IndexedDB, gravação com fila de sincronização, backup
    sync.ts, supabase.ts  sincronização com o Supabase
    session.ts            regras da sessão (concluir série, substituir, encerrar…)
    progression.ts        progressão dupla e histórico por exercício
    stats.ts              indicadores do painel
    validation.ts         esquemas Zod
supabase/migrations/      esquema SQL, RLS e view analítica
scripts/                  gerador do service worker, ícones e servidor estático
```

### Modelo de dados

| Entidade | Principais campos |
| --- | --- |
| `Exercise` | nome, grupo muscular, auxiliares, equipamento, unidade (reps/segundos), séries e faixa padrão, descanso, RIR alvo, observações de execução, mídia, `alternativeIds` |
| `WorkoutTemplate` (A–D) | nome, ênfase, dia da semana, `items[]` (posição, exercício, séries, faixa, descanso, RIR) |
| `WorkoutSession` | treino, início/fim, status (em andamento, concluída, interrompida), motivo, `exercises[]` com exercício planejado e executado, substituição, `sets[]` (carga, repetições, RIR, horário), observações e decisão de carga |
| `DiscomfortLog` | sessão, exercício, região, intensidade, características, ação tomada, observação |
| `Profile` | preferências do usuário |

No Supabase, cada tabela guarda o registro completo em `data` (jsonb) e expõe colunas geradas para consultas. A view `set_logs` fornece uma linha por série registrada, para relatórios em SQL.

## Configuração e execução

Pré-requisito: Node.js 20.9 ou superior.

```bash
cd treino-full-body
npm install
npm run dev          # desenvolvimento em http://localhost:3000 (sem service worker)
```

Build de produção, com PWA e funcionamento offline:

```bash
npm run build        # gera out/ e out/sw.js
npm start            # serve out/ em http://localhost:3000
```

A pasta `out/` é estática e pode ser publicada em qualquer hospedagem (Vercel, Netlify, Cloudflare Pages, GitHub Pages com domínio próprio etc.). O service worker exige HTTPS, com exceção de `localhost`.

Outros comandos:

```bash
npm test             # testes unitários (domínio, validação e sincronização)
npm run typecheck    # verificação de tipos
npm run icons        # regenera os ícones PNG do PWA
```

### Publicação no GitHub Pages (automática)

O workflow `.github/workflows/treino-full-body.yml` roda testes, verificação de tipos e build em cada pull request. A cada push na branch padrão do repositório, ele publica o site em:

- `https://kuczkovski.github.io/AULAS/treino/` — este app
- `https://kuczkovski.github.io/AULAS/fracoes/` — a ferramenta de frações, que continua disponível

Configuração, feita uma única vez: em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**. Depois disso, cada merge na branch padrão publica sozinho. Para publicar sem novo commit, use **Actions → Treino Full Body → Run workflow**.

Para publicar em outro subcaminho ou hospedagem, defina `NEXT_PUBLIC_BASE_PATH` no build (por exemplo, `NEXT_PUBLIC_BASE_PATH=/treino npm run build`). Deixe vazio para publicar na raiz do domínio.

### Supabase (opcional)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute `supabase/migrations/0001_init.sql`. O script é idempotente e pode ser executado novamente. Com a Supabase CLI, também funciona `supabase db push`.
3. Em **Authentication → URL Configuration**, defina a *Site URL* e adicione `https://SEU-DOMINIO/perfil/` (e `http://localhost:3000/perfil/` para testes) em *Redirect URLs*. Isso é necessário para o link de acesso por e-mail e para a confirmação de cadastro.
4. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (em **Project Settings → API**). As variáveis são incorporadas no build, então rode `npm run build` novamente depois de alterá-las. Para a versão publicada no GitHub Pages, cadastre os mesmos nomes em **Settings → Secrets and variables → Actions → Variables** (a chave *anon* é pública por natureza; os dados continuam protegidos pelo RLS). A URL de retorno do login no Pages é `https://kuczkovski.github.io/AULAS/treino/perfil/`.
5. No app, abra **Perfil**, crie uma conta ou entre. Os dados que já estão no aparelho são vinculados à conta e enviados.

Se um aparelho tiver dados de outra conta, a sincronização é bloqueada para evitar mistura. O Perfil oferece exportar o backup ou apagar os dados locais.

### Instalação no celular

Abra o endereço publicado no navegador e use **Adicionar à tela inicial** (Safari no iOS) ou **Instalar aplicativo** (Chrome no Android; o botão também aparece no Perfil quando disponível). Durante o treino, a tela permanece ligada nos navegadores compatíveis com a Wake Lock API.

## Aviso

Este aplicativo é uma ferramenta de registro e não substitui a orientação de profissionais de educação física ou de saúde. Em caso de dor persistente, dor irradiada ou piora dos sintomas, interrompa a atividade e procure avaliação profissional.
