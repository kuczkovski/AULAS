-- Esquema do Treino Full Body.
-- Cada tabela guarda o registro completo em `data` (jsonb, mesmo formato do
-- IndexedDB local) e expõe colunas geradas para consultas e relatórios.
-- `updated_at` é o carimbo do cliente (epoch ms) usado para "última
-- gravação vence"; `server_updated_at` é o cursor de sincronização.

create extension if not exists pgcrypto;

-- Função comum: ignora gravações mais antigas que a versão atual e
-- atualiza o cursor do servidor.
create or replace function public.sync_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return old;
  end if;
  new.server_updated_at := clock_timestamp();
  return new;
end;
$$;

-- ---------------------------------------------------------------- exercises
create table if not exists public.exercises (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  data jsonb not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default clock_timestamp(),
  name text generated always as (data ->> 'name') stored,
  muscle_group text generated always as (data ->> 'muscleGroup') stored,
  equipment text generated always as (data ->> 'equipment') stored,
  primary key (user_id, id),
  constraint exercises_data_is_object check (jsonb_typeof(data) = 'object')
);

-- -------------------------------------------------------- workout_templates
create table if not exists public.workout_templates (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  data jsonb not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default clock_timestamp(),
  name text generated always as (data ->> 'name') stored,
  weekday smallint generated always as ((data ->> 'weekday')::smallint) stored,
  primary key (user_id, id),
  constraint workout_templates_id check (id in ('A', 'B', 'C', 'D'))
);

-- --------------------------------------------------------- workout_sessions
create table if not exists public.workout_sessions (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  data jsonb not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default clock_timestamp(),
  template_id text generated always as (data ->> 'templateId') stored,
  status text generated always as (data ->> 'status') stored,
  started_at bigint generated always as ((data ->> 'startedAt')::bigint) stored,
  ended_at bigint generated always as ((data ->> 'endedAt')::bigint) stored,
  primary key (user_id, id),
  constraint workout_sessions_status check ((data ->> 'status') in ('in_progress', 'completed', 'interrupted'))
);

-- ---------------------------------------------------------- discomfort_logs
create table if not exists public.discomfort_logs (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  data jsonb not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default clock_timestamp(),
  session_id text generated always as (data ->> 'sessionId') stored,
  region text generated always as (data ->> 'region') stored,
  intensity smallint generated always as ((data ->> 'intensity')::smallint) stored,
  primary key (user_id, id),
  constraint discomfort_intensity check (((data ->> 'intensity')::int) between 0 and 10)
);

-- ----------------------------------------------------------------- profiles
create table if not exists public.profiles (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  data jsonb not null,
  updated_at bigint not null,
  deleted_at bigint,
  server_updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

-- Índices do cursor de sincronização, triggers e RLS para todas as tabelas.
do $$
declare
  t text;
begin
  foreach t in array array['exercises', 'workout_templates', 'workout_sessions', 'discomfort_logs', 'profiles']
  loop
    execute format('create index if not exists %1$s_sync_idx on public.%1$s (user_id, server_updated_at)', t);
    execute format('drop trigger if exists %1$s_sync_guard on public.%1$s', t);
    execute format('create trigger %1$s_sync_guard before insert or update on public.%1$s for each row execute function public.sync_guard()', t);
    execute format('alter table public.%1$s enable row level security', t);
    execute format('drop policy if exists "%1$s_owner" on public.%1$s', t);
    execute format(
      'create policy "%1$s_owner" on public.%1$s for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t
    );
  end loop;
end;
$$;

-- Visão analítica: uma linha por série registrada (útil para relatórios SQL).
create or replace view public.set_logs
with (security_invoker = true) as
select
  s.user_id,
  s.id as session_id,
  s.template_id,
  s.started_at,
  (ex ->> 'slotId') as slot_id,
  (ex ->> 'exerciseId') as exercise_id,
  (ex ->> 'plannedExerciseId') as planned_exercise_id,
  (ex ->> 'exerciseName') as exercise_name,
  (ex ->> 'muscleGroup') as muscle_group,
  ((st ->> 'index')::int + 1) as set_number,
  (st ->> 'load')::numeric as load,
  (st ->> 'reps')::int as reps,
  (st ->> 'rir')::int as rir,
  (st ->> 'completedAt')::bigint as completed_at
from public.workout_sessions s
cross join lateral jsonb_array_elements(s.data -> 'exercises') ex
cross join lateral jsonb_array_elements(ex -> 'sets') st
where s.deleted_at is null
  and st ->> 'completedAt' is not null;
