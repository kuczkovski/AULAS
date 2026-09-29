-- Torre Infinita — esquema inicial.
--
-- Modelo de acesso:
--   * Professores entram com e-mail (Supabase Auth) e são donos de turmas.
--   * Alunos não têm e-mail: entram com código + PIN individual. O app abre uma
--     sessão anônima do Supabase e a função entrar_aluno() a vincula ao aluno.
--   * Nenhum dado pessoal (nome real, código) aparece para outros alunos:
--     o placar expõe só apelido, avatar e pontos, via placar_turma().
--
-- Requer "Anonymous sign-ins" ativado em Authentication > Providers.

-- No Supabase o pgcrypto vive no schema extensions; as funções que usam crypt()
-- incluem esse schema no search_path.
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- tabelas

create table public.turmas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  ano smallint not null check (ano between 6 and 9),
  meta_semanal integer not null default 5000 check (meta_semanal > 0),
  criada_em timestamptz not null default now()
);
create index on public.turmas (professor_id);

create table public.alunos (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas (id) on delete cascade,
  codigo text not null unique check (codigo ~ '^[A-Za-z0-9._-]{3,20}$'),
  nome text not null check (char_length(nome) between 1 and 100),  -- só o professor vê
  pin_hash text not null,
  apelido text check (apelido is null or char_length(apelido) between 2 and 14),
  avatar jsonb not null default '{}'::jsonb,
  auth_uid uuid unique,          -- sessão anônima atualmente vinculada
  criado_em timestamptz not null default now()
);
create index on public.alunos (turma_id);

create table public.estado_aluno (
  aluno_id uuid primary key references public.alunos (id) on delete cascade,
  estado jsonb not null,
  atualizado_em timestamptz not null default now()
);

create table public.rodadas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos (id) on delete cascade,
  turma_id uuid not null references public.turmas (id) on delete cascade,
  tipo text not null check (tipo in ('nivelamento', 'treino', 'revisao', 'chefe')),
  andar integer check (andar is null or andar > 0),
  acertos integer not null check (acertos >= 0),
  total integer not null check (total > 0 and total <= 60),
  pontos integer not null check (pontos >= 0),
  duracao_s integer check (duracao_s is null or duracao_s between 0 and 7200),
  falhou boolean not null default false,
  semana date not null,
  criada_em timestamptz not null default now(),
  -- teto por rodada: ~70 pontos por pergunta mais bônus. Barra o envio de placar forjado.
  check (acertos <= total and pontos <= total * 70 + 400)
);
create index on public.rodadas (aluno_id, criada_em desc);
create index on public.rodadas (turma_id, semana);

create table public.palavras_bloqueadas (palavra text primary key);
insert into public.palavras_bloqueadas (palavra) values
  ('porra'), ('caralho'), ('merda'), ('puta'), ('buceta'), ('viado'), ('otario'),
  ('idiota'), ('burro'), ('cuzao'), ('foder'), ('fdp'), ('pqp'), ('nazi'), ('hitler');

create table public.tentativas_login (
  codigo text primary key,
  falhas integer not null default 0,
  bloqueado_ate timestamptz
);

-- ---------------------------------------------------------------- gatilhos

-- O servidor decide turma e semana da rodada: o cliente não pode forjá-las.
create function public.rodada_preencher() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select turma_id into new.turma_id from public.alunos where id = new.aluno_id;
  new.semana := (date_trunc('week', now() at time zone 'America/Cuiaba'))::date;
  new.criada_em := now();
  return new;
end $$;

create trigger rodadas_preencher before insert on public.rodadas
  for each row execute function public.rodada_preencher();

-- ---------------------------------------------------------------- RLS

alter table public.turmas enable row level security;
alter table public.alunos enable row level security;
alter table public.estado_aluno enable row level security;
alter table public.rodadas enable row level security;
alter table public.palavras_bloqueadas enable row level security;
alter table public.tentativas_login enable row level security;

create function public.eh_professor_da_turma(p_turma uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.turmas t where t.id = p_turma and t.professor_id = auth.uid());
$$;

create function public.aluno_atual() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.alunos where auth_uid = auth.uid();
$$;

-- Sessões anônimas (alunos) não criam turmas.
create policy turmas_professor on public.turmas for all to authenticated
  using (professor_id = auth.uid())
  with check (professor_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

create policy alunos_professor on public.alunos for all to authenticated
  using (public.eh_professor_da_turma(turma_id))
  with check (public.eh_professor_da_turma(turma_id));
create policy alunos_proprio on public.alunos for select to authenticated
  using (auth_uid = auth.uid());

create policy estado_proprio on public.estado_aluno for all to authenticated
  using (aluno_id = public.aluno_atual())
  with check (aluno_id = public.aluno_atual());
create policy estado_professor on public.estado_aluno for select to authenticated
  using (exists (select 1 from public.alunos a where a.id = aluno_id and public.eh_professor_da_turma(a.turma_id)));

create policy rodadas_proprio_ler on public.rodadas for select to authenticated
  using (aluno_id = public.aluno_atual());
create policy rodadas_proprio_inserir on public.rodadas for insert to authenticated
  with check (aluno_id = public.aluno_atual());
create policy rodadas_professor on public.rodadas for select to authenticated
  using (public.eh_professor_da_turma(turma_id));

-- palavras_bloqueadas e tentativas_login: sem políticas = só funções definer acessam.

-- ---------------------------------------------------------------- funções do aluno

create function public.entrar_aluno(p_codigo text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_aluno public.alunos;
  v_turma public.turmas;
  v_tent public.tentativas_login;
begin
  if auth.uid() is null then raise exception 'sem-sessao'; end if;
  p_codigo := lower(trim(coalesce(p_codigo, '')));

  select * into v_tent from public.tentativas_login where codigo = p_codigo;
  -- Falhas de login devolvem {"erro": ...} em vez de lançar exceção: uma exceção
  -- desfaria a transação e o contador de tentativas nunca seria gravado.
  if v_tent.bloqueado_ate is not null and v_tent.bloqueado_ate > now() then
    return jsonb_build_object('erro', 'bloqueado');
  end if;

  select * into v_aluno from public.alunos where lower(codigo) = p_codigo;
  if not found or v_aluno.pin_hash <> crypt(coalesce(p_pin, ''), v_aluno.pin_hash) then
    insert into public.tentativas_login (codigo, falhas) values (p_codigo, 1)
    on conflict (codigo) do update set
      falhas = case when public.tentativas_login.bloqueado_ate is not null and public.tentativas_login.bloqueado_ate <= now() then 1 else public.tentativas_login.falhas + 1 end,
      bloqueado_ate = case when public.tentativas_login.falhas + 1 >= 5 then now() + interval '10 minutes' else null end;
    return jsonb_build_object('erro', 'codigo-ou-pin-invalido');
  end if;

  delete from public.tentativas_login where codigo = p_codigo;
  -- um aparelho por vez: a sessão anterior perde o vínculo
  update public.alunos set auth_uid = null where auth_uid = auth.uid() and id <> v_aluno.id;
  update public.alunos set auth_uid = auth.uid() where id = v_aluno.id;
  select * into v_turma from public.turmas where id = v_aluno.turma_id;

  return jsonb_build_object(
    'aluno_id', v_aluno.id, 'turma_id', v_turma.id, 'turma', v_turma.nome, 'ano', v_turma.ano,
    'apelido', v_aluno.apelido, 'avatar', v_aluno.avatar);
end $$;

create function public.apelido_valido(p_apelido text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_apelido ~ '^[[:alpha:]][[:alnum:] .]{1,13}$'
    and not exists (
      select 1 from public.palavras_bloqueadas b
      where regexp_replace(lower(p_apelido), '[^[:alpha:]]', '', 'g') like '%' || b.palavra || '%');
$$;

create function public.aluno_atualizar_perfil(p_apelido text, p_avatar jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.aluno_atual() is null then raise exception 'sem-aluno'; end if;
  p_apelido := regexp_replace(trim(p_apelido), '\s+', ' ', 'g');
  if not public.apelido_valido(p_apelido) then raise exception 'apelido-invalido'; end if;
  update public.alunos set apelido = p_apelido, avatar = coalesce(p_avatar, '{}'::jsonb)
  where id = public.aluno_atual();
end $$;

-- Placar semanal da turma do aluno. Limite de 2000 pontos por dia: o placar
-- premia constância, não maratona. Não expõe código nem nome.
create function public.placar_turma() returns table (apelido text, avatar jsonb, pontos bigint, nivel integer, eu boolean)
language sql stable security definer set search_path = public as $$
  with eu as (select id, turma_id from public.alunos where auth_uid = auth.uid()),
  semana as (select (date_trunc('week', now() at time zone 'America/Cuiaba'))::date as ini),
  por_dia as (
    select r.aluno_id, (r.criada_em at time zone 'America/Cuiaba')::date as dia, sum(r.pontos) as pts
    from public.rodadas r, eu, semana
    where r.turma_id = eu.turma_id and r.semana = semana.ini and r.tipo <> 'nivelamento'
    group by 1, 2)
  select a.apelido, a.avatar, sum(least(d.pts, 2000))::bigint as pontos,
         coalesce((e.estado ->> 'nivel')::integer, 1) as nivel, (a.id = eu.id) as eu
  from por_dia d
  join public.alunos a on a.id = d.aluno_id
  left join public.estado_aluno e on e.aluno_id = a.id
  cross join eu
  where a.apelido is not null
  group by a.id, a.apelido, a.avatar, e.estado, eu.id
  order by pontos desc
  limit 50;
$$;

create function public.meta_turma() returns jsonb
language sql stable security definer set search_path = public as $$
  with eu as (select a.id, a.turma_id from public.alunos a where a.auth_uid = auth.uid()),
  semana as (select (date_trunc('week', now() at time zone 'America/Cuiaba'))::date as ini)
  select jsonb_build_object(
    'meta', t.meta_semanal,
    'pontos', coalesce((select sum(r.pontos) from public.rodadas r, semana where r.turma_id = t.id and r.semana = semana.ini and r.tipo <> 'nivelamento'), 0),
    'alunos', (select count(*) from public.alunos where turma_id = t.id),
    'ativos', (select count(distinct r.aluno_id) from public.rodadas r, semana where r.turma_id = t.id and r.semana = semana.ini))
  from public.turmas t join eu on eu.turma_id = t.id;
$$;

-- ---------------------------------------------------------------- funções do professor

-- p_alunos: [{"codigo": "e2700573", "nome": "Ana Souza"}, ...]. Gera um PIN de 4 dígitos
-- por aluno novo e o devolve uma única vez (só o hash fica guardado). Código que já
-- existe na mesma turma só tem o nome atualizado; em outra turma, é recusado.
create function public.novo_pin() returns text
language sql volatile as $$ select lpad((floor(random() * 10000))::int::text, 4, '0') $$;

create function public.professor_importar_alunos(p_turma uuid, p_alunos jsonb)
returns table (codigo text, nome text, pin text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  item jsonb;
  v_cod text;
  v_nome text;
  v_pin text;
  v_turma uuid;
begin
  if not public.eh_professor_da_turma(p_turma) then raise exception 'sem-permissao'; end if;
  for item in select * from jsonb_array_elements(p_alunos) loop
    v_cod := lower(trim(item ->> 'codigo'));
    v_nome := trim(item ->> 'nome');
    select a.turma_id into v_turma from public.alunos a where a.codigo = v_cod;
    if found then
      if v_turma <> p_turma then raise exception 'codigo-em-uso: %', v_cod; end if;
      update public.alunos a set nome = v_nome where a.codigo = v_cod;
    else
      v_pin := public.novo_pin();
      insert into public.alunos (turma_id, codigo, nome, pin_hash)
      values (p_turma, v_cod, v_nome, crypt(v_pin, gen_salt('bf')));
      codigo := v_cod; nome := v_nome; pin := v_pin;
      return next;
    end if;
  end loop;
end $$;

create function public.professor_resetar_pin(p_aluno uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_pin text := public.novo_pin();
begin
  update public.alunos a set pin_hash = crypt(v_pin, gen_salt('bf')), auth_uid = null
  where a.id = p_aluno and public.eh_professor_da_turma(a.turma_id);
  if not found then raise exception 'sem-permissao'; end if;
  delete from public.tentativas_login where codigo = (select lower(codigo) from public.alunos where id = p_aluno);
  return v_pin;
end $$;

-- Resumo semanal por aluno para o painel do professor (respeita a RLS de rodadas).
create view public.resumo_semanal with (security_invoker = true) as
select r.turma_id, r.aluno_id, r.semana,
       count(*) filter (where r.tipo <> 'nivelamento') as rodadas,
       coalesce(sum(r.pontos) filter (where r.tipo <> 'nivelamento'), 0) as pontos,
       coalesce(sum(r.duracao_s), 0) / 60 as minutos,
       max(r.criada_em) as ultima
from public.rodadas r
group by r.turma_id, r.aluno_id, r.semana;

-- ---------------------------------------------------------------- permissões

revoke all on function public.entrar_aluno(text, text), public.aluno_atualizar_perfil(text, jsonb),
  public.placar_turma(), public.meta_turma(), public.professor_importar_alunos(uuid, jsonb),
  public.professor_resetar_pin(uuid), public.apelido_valido(text), public.novo_pin(),
  public.eh_professor_da_turma(uuid), public.aluno_atual() from public, anon;
grant execute on function public.entrar_aluno(text, text), public.aluno_atualizar_perfil(text, jsonb),
  public.placar_turma(), public.meta_turma(), public.professor_importar_alunos(uuid, jsonb),
  public.professor_resetar_pin(uuid), public.eh_professor_da_turma(uuid), public.aluno_atual() to authenticated;
