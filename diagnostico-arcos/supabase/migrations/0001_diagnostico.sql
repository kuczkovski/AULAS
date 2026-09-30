-- Avaliação diagnóstica: relações entre arcos e ângulos na circunferência (1º ano do EM).
--
-- Modelo de acesso
--   * O aluno não tem login. Ele só fala com o banco por funções (RPC) que recebem o id da
--     tentativa, um UUID aleatório guardado no navegador dele. Nenhuma tabela é legível pelo papel `anon`.
--   * O gabarito fica em `gabarito`, sem acesso público: a correção é feita aqui, e o navegador do
--     aluno nunca recebe a resposta certa.
--   * O professor entra com e-mail e senha (Supabase Auth); só e-mails da tabela `professores`
--     leem as tabelas. Para autorizar:  insert into public.professores (email) values ('nome@escola.edu.br');
--     (em minúsculas). Desative "Allow new users to sign up" no Auth: os professores são criados por você.
--
-- Use um projeto Supabase só para esta ferramenta (os nomes de tabelas são genéricos).

create table public.professores (
  email text primary key check (email = lower(email))
);
alter table public.professores enable row level security;  -- sem políticas: só funções internas leem

create table public.gabarito (
  question_id text primary key,
  skill text not null check (skill in ('D1', 'D2', 'D3', 'D4')),
  tipo text not null check (tipo in ('multipla', 'numerica')),
  opcoes text[],
  correta text not null,
  check ((tipo = 'multipla') = (opcoes is not null))
);
alter table public.gabarito enable row level security;

insert into public.gabarito (question_id, skill, tipo, opcoes, correta) values
  ('Q1',  'D1', 'multipla', array['Corda','Raio','Diâmetro','Arco'], 'Raio'),
  ('Q2',  'D1', 'multipla', array['3 cm','6 cm','12 cm','36 cm'], '12 cm'),
  ('Q3',  'D1', 'multipla', array['Raio','Corda','Arco','Semirreta'], 'Corda'),
  ('Q4',  'D2', 'multipla', array['Agudo','Reto','Obtuso','Raso'], 'Agudo'),
  ('Q5',  'D2', 'multipla', array['90°','180°','270°','360°'], '360°'),
  ('Q6',  'D2', 'numerica', null, '180'),
  ('Q7',  'D2', 'numerica', null, '90'),
  ('Q8',  'D3', 'multipla', array['Raio','Diâmetro','Arco','Tangente'], 'Diâmetro'),
  ('Q9',  'D3', 'multipla', array['Todo raio é um diâmetro','Todo diâmetro é uma corda','Toda corda é um diâmetro','Corda e arco são a mesma coisa'], 'Todo diâmetro é uma corda'),
  ('Q10', 'D3', 'multipla', array['Círculo','Circunferência','Disco','Diâmetro'], 'Circunferência'),
  ('Q11', 'D4', 'numerica', null, '180'),
  ('Q12', 'D4', 'numerica', null, '90'),
  ('Q13', 'D4', 'numerica', null, '180'),
  ('Q14', 'D4', 'multipla', array['45°','90°','180°','Não existe relação possível'], '90°'),
  ('Q15', 'D4', 'numerica', null, '120');

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_name text not null check (char_length(student_name) between 3 and 120),
  student_key text not null,                     -- nome normalizado, para achar tentativas repetidas
  class_name text not null check (class_name in ('1º A', '1º B', '1º C', '1º D', '1º E')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds integer,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'concluida', 'encerrada_por_tempo')),
  total_correct integer,
  total_questions integer,
  percentage numeric(5, 2)
);
alter table public.attempts enable row level security;
-- no máximo uma tentativa em andamento por aluno (nome + turma), mesmo com dois cliques simultâneos
create unique index attempts_uma_em_andamento on public.attempts (student_key, class_name) where status = 'em_andamento';
create index attempts_turma on public.attempts (class_name, started_at desc);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id text not null references public.gabarito (question_id),
  student_answer text not null,
  is_correct boolean not null,
  skill text not null,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);
alter table public.answers enable row level security;

create table public.self_assessment (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  item text not null check (item in ('A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7')),
  score smallint not null check (score between 1 and 4),
  unique (attempt_id, item)
);
alter table public.self_assessment enable row level security;

-- ---------------------------------------------------------------------------
-- Funções internas (nenhum papel de API executa)

create function public.duracao_prova() returns interval
language sql immutable as $$ select interval '60 minutes' $$;

-- tolerância de rede para um salvamento que chega logo depois do fim do tempo
create function public._tolerancia() returns interval
language sql immutable as $$ select interval '20 seconds' $$;

create function public._nivel(p numeric) returns text
language sql immutable as $$
  select case when p >= 80 then 'consolidado' when p >= 60 then 'funcional' when p >= 40 then 'fragil' else 'recomposicao' end
$$;

create function public._chave_nome(p text) returns text
language sql immutable as $$
  select translate(lower(regexp_replace(trim(p), '\s+', ' ', 'g')),
                   'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
$$;

-- Fecha a tentativa: grava totais, hora de término e status.
create function public._encerrar(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare v_tc integer; v_tq integer;
begin
  select count(*) filter (where is_correct) into v_tc from public.answers where attempt_id = p_id;
  select count(*) into v_tq from public.gabarito;
  update public.attempts a set
    status = p_status,
    finished_at = case when p_status = 'encerrada_por_tempo' then a.started_at + public.duracao_prova() else now() end,
    duration_seconds = extract(epoch from
      (case when p_status = 'encerrada_por_tempo' then a.started_at + public.duracao_prova() else now() end) - a.started_at)::integer,
    total_correct = v_tc,
    total_questions = v_tq,
    percentage = round(100.0 * v_tc / v_tq, 2)
  where a.id = p_id and a.status = 'em_andamento';
end $$;

create function public._encerrar_vencidas() returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.attempts
           where status = 'em_andamento' and started_at + public.duracao_prova() + public._tolerancia() < now()
  loop
    perform public._encerrar(r.id, 'encerrada_por_tempo');
  end loop;
end $$;

-- Síntese por dimensão. Questão sem resposta conta como não acertada.
create function public._resumo(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'dimensoes', (
      select jsonb_object_agg(t.skill, jsonb_build_object(
        'acertos', t.acertos, 'total', t.total,
        'pct', round(100.0 * t.acertos / t.total, 1), 'nivel', public._nivel(100.0 * t.acertos / t.total)))
      from (select g.skill, count(*) as total, count(*) filter (where a.is_correct) as acertos
            from public.gabarito g
            left join public.answers a on a.question_id = g.question_id and a.attempt_id = p_id
            group by g.skill) t),
    'total_correct', (select count(*) from public.answers where attempt_id = p_id and is_correct),
    'total_questions', (select count(*) from public.gabarito))
$$;

create function public._estado(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', a.id, 'nome', a.student_name, 'turma', a.class_name, 'status', a.status,
    'inicio', a.started_at, 'prazo', a.started_at + public.duracao_prova(), 'agora', now(),
    'respostas', coalesce((select jsonb_object_agg(r.question_id, r.student_answer) from public.answers r where r.attempt_id = a.id), '{}'::jsonb),
    'autoavaliacao', coalesce((select jsonb_object_agg(s.item, s.score) from public.self_assessment s where s.attempt_id = a.id), '{}'::jsonb),
    'resumo', case when a.status <> 'em_andamento' then public._resumo(a.id) end)
  from public.attempts a where a.id = p_id
$$;

revoke all on function public._encerrar(uuid, text), public._encerrar_vencidas(), public._resumo(uuid), public._estado(uuid),
  public._nivel(numeric), public._chave_nome(text), public._tolerancia(), public.duracao_prova() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Funções do aluno (sem login: o id da tentativa é a credencial)

-- Cria a tentativa. Se já existe uma em andamento para o mesmo nome e turma, devolve
-- {conflito: true} para o app oferecer "Continuar avaliação"; com p_continuar = true devolve essa tentativa.
create function public.iniciar_tentativa(p_nome text, p_turma text, p_continuar boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_nome text := regexp_replace(trim(coalesce(p_nome, '')), '\s+', ' ', 'g');
  v_key text;
  v_id uuid;
begin
  if char_length(v_nome) < 3 or char_length(v_nome) > 120 or position(' ' in v_nome) = 0 then
    raise exception 'nome-invalido';
  end if;
  if p_turma is null or p_turma not in ('1º A', '1º B', '1º C', '1º D', '1º E') then
    raise exception 'turma-invalida';
  end if;
  v_key := public._chave_nome(v_nome);

  perform public._encerrar_vencidas();

  select id into v_id from public.attempts where student_key = v_key and class_name = p_turma and status = 'em_andamento';
  if v_id is not null then
    if p_continuar then return public._estado(v_id); end if;
    return jsonb_build_object('conflito', true,
      'respondidas', (select count(*) from public.answers where attempt_id = v_id),
      'inicio', (select started_at from public.attempts where id = v_id));
  end if;

  begin
    insert into public.attempts (student_name, student_key, class_name) values (v_nome, v_key, p_turma) returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('conflito', true, 'respondidas', 0, 'inicio', now());
  end;
  return public._estado(v_id);
end $$;

create function public.obter_tentativa(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public._encerrar_vencidas();
  if not exists (select 1 from public.attempts where id = p_id) then raise exception 'tentativa-inexistente'; end if;
  return public._estado(p_id);
end $$;

-- Grava (ou troca) a resposta de uma questão. Corrige aqui; o aluno não recebe o resultado.
create function public.salvar_resposta(p_id uuid, p_questao text, p_resposta text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a public.attempts;
  g public.gabarito;
  v text;
  v_ok boolean;
begin
  select * into a from public.attempts where id = p_id for update;
  if not found then raise exception 'tentativa-inexistente'; end if;
  if a.status <> 'em_andamento' then return jsonb_build_object('ok', false, 'status', a.status); end if;
  if now() > a.started_at + public.duracao_prova() + public._tolerancia() then
    perform public._encerrar(p_id, 'encerrada_por_tempo');
    return jsonb_build_object('ok', false, 'status', 'encerrada_por_tempo');
  end if;

  select * into g from public.gabarito where question_id = p_questao;
  if not found then raise exception 'questao-invalida'; end if;

  if g.tipo = 'multipla' then
    if p_resposta is null or not (p_resposta = any (g.opcoes)) then raise exception 'resposta-invalida'; end if;
    v := p_resposta;
    v_ok := (v = g.correta);
  else
    v := lower(trim(coalesce(p_resposta, '')));
    v := replace(trim(regexp_replace(v, '(°|º|graus?|deg)\s*$', '')), ',', '.');
    if v !~ '^[0-9]{1,4}(\.[0-9]{1,4})?$' then raise exception 'resposta-invalida'; end if;
    v := trim_scale(v::numeric)::text;
    v_ok := (v::numeric = g.correta::numeric);
  end if;

  insert into public.answers (attempt_id, question_id, student_answer, is_correct, skill)
  values (p_id, p_questao, v, v_ok, g.skill)
  on conflict (attempt_id, question_id) do update
    set student_answer = excluded.student_answer, is_correct = excluded.is_correct, answered_at = now();
  return jsonb_build_object('ok', true, 'agora', now());
end $$;

-- p_itens: objeto {"A1": 3, "A2": 4, ...}
create function public.salvar_autoavaliacao(p_id uuid, p_itens jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a public.attempts;
  r record;
begin
  select * into a from public.attempts where id = p_id for update;
  if not found then raise exception 'tentativa-inexistente'; end if;
  if a.status <> 'em_andamento' then return jsonb_build_object('ok', false, 'status', a.status); end if;
  if now() > a.started_at + public.duracao_prova() + public._tolerancia() then
    perform public._encerrar(p_id, 'encerrada_por_tempo');
    return jsonb_build_object('ok', false, 'status', 'encerrada_por_tempo');
  end if;
  if jsonb_typeof(p_itens) is distinct from 'object' then raise exception 'autoavaliacao-invalida'; end if;

  for r in select key, value from jsonb_each(p_itens) loop
    if r.key !~ '^A[1-7]$' or jsonb_typeof(r.value) <> 'number' or (r.value #>> '{}') !~ '^[1-4]$' then
      raise exception 'autoavaliacao-invalida';
    end if;
    insert into public.self_assessment (attempt_id, item, score) values (p_id, r.key, (r.value #>> '{}')::smallint)
    on conflict (attempt_id, item) do update set score = excluded.score;
  end loop;
  return jsonb_build_object('ok', true);
end $$;

-- Encerra a tentativa e devolve a síntese. Idempotente: depois de encerrada, só devolve a síntese.
-- p_por_tempo: o cronômetro do aluno zerou (aceito só se o prazo realmente acabou).
create function public.finalizar_tentativa(p_id uuid, p_por_tempo boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a public.attempts;
  v_fim timestamptz;
begin
  select * into a from public.attempts where id = p_id for update;
  if not found then raise exception 'tentativa-inexistente'; end if;
  if a.status = 'em_andamento' then
    v_fim := a.started_at + public.duracao_prova();
    if now() >= v_fim then
      perform public._encerrar(p_id, 'encerrada_por_tempo');
    elsif p_por_tempo then
      if now() >= v_fim - interval '10 seconds' then
        perform public._encerrar(p_id, 'encerrada_por_tempo');
      else
        raise exception 'tempo-nao-esgotado';
      end if;
    else
      if (select count(*) from public.answers where attempt_id = p_id) < (select count(*) from public.gabarito) then
        raise exception 'incompleta';
      end if;
      perform public._encerrar(p_id, 'concluida');
    end if;
  end if;
  return public._estado(p_id);
end $$;

grant execute on function
  public.iniciar_tentativa(text, text, boolean), public.obter_tentativa(uuid), public.salvar_resposta(uuid, text, text),
  public.salvar_autoavaliacao(uuid, jsonb), public.finalizar_tentativa(uuid, boolean)
to anon, authenticated;
revoke execute on function
  public.iniciar_tentativa(text, text, boolean), public.obter_tentativa(uuid), public.salvar_resposta(uuid, text, text),
  public.salvar_autoavaliacao(uuid, jsonb), public.finalizar_tentativa(uuid, boolean)
from public;

-- ---------------------------------------------------------------------------
-- Professor

create function public.professor_cadastrado() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.professores p where p.email = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;
revoke all on function public.professor_cadastrado() from public, anon;
grant execute on function public.professor_cadastrado() to authenticated;

-- Fecha tentativas com o tempo vencido (o aluno fechou a aba no meio da prova) antes de o painel ler os dados.
create function public.professor_atualizar() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.professor_cadastrado() then raise exception 'sem-permissao'; end if;
  perform public._encerrar_vencidas();
end $$;
revoke all on function public.professor_atualizar() from public, anon;
grant execute on function public.professor_atualizar() to authenticated;

-- Só leitura (e apagar tentativas de teste) para professores cadastrados; nada para `anon`.
revoke all on public.professores, public.gabarito, public.attempts, public.answers, public.self_assessment from anon, authenticated;
grant select on public.gabarito, public.attempts, public.answers, public.self_assessment to authenticated;
grant delete on public.attempts to authenticated;

create policy gabarito_professor on public.gabarito for select to authenticated using (public.professor_cadastrado());
create policy attempts_professor on public.attempts for select to authenticated using (public.professor_cadastrado());
create policy attempts_professor_apagar on public.attempts for delete to authenticated using (public.professor_cadastrado());
create policy answers_professor on public.answers for select to authenticated using (public.professor_cadastrado());
create policy self_professor on public.self_assessment for select to authenticated using (public.professor_cadastrado());
