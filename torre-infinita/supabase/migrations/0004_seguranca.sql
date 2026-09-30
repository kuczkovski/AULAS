-- Endurecimento de segurança.
--
-- 1. Só e-mails cadastrados em `professores` podem criar turmas. Sem isso, qualquer pessoa que
--    abrisse uma conta de e-mail poderia importar códigos de alunos reais antes do professor
--    (ficando com os PINs) e descobrir quais códigos existem pela mensagem "codigo-em-uso".
--    Para autorizar um professor:  insert into public.professores (email) values ('nome@escola.edu.br');
-- 2. O avatar só aceita três números dentro do intervalo conhecido (antes aceitava qualquer JSON).
-- 3. PINs vêm de um gerador criptográfico (antes, random()).

create table public.professores (
  email text primary key check (email = lower(email))
);
alter table public.professores enable row level security;  -- sem políticas: só funções internas leem

create function public.professor_cadastrado() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.professores p where p.email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.professor_cadastrado() from public, anon;
grant execute on function public.professor_cadastrado() to authenticated;

drop policy turmas_professor on public.turmas;
create policy turmas_professor on public.turmas for all to authenticated
  using (professor_id = auth.uid())
  with check (
    professor_id = auth.uid()
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and public.professor_cadastrado()
  );

create or replace function public.aluno_atualizar_perfil(p_apelido text, p_avatar jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.aluno_atual() is null then raise exception 'sem-aluno'; end if;
  p_apelido := regexp_replace(trim(p_apelido), '\s+', ' ', 'g');
  if not public.apelido_valido(p_apelido) then raise exception 'apelido-invalido'; end if;
  -- exatamente cor (0-5), forma (0-3) e acessório (0-13), todos inteiros
  if jsonb_typeof(p_avatar) is distinct from 'object'
     or (select count(*) from jsonb_object_keys(p_avatar)) <> 3
     or coalesce(p_avatar ->> 'cor', '') !~ '^[0-5]$'
     or coalesce(p_avatar ->> 'forma', '') !~ '^[0-3]$'
     or coalesce(p_avatar ->> 'acessorio', '') !~ '^([0-9]|1[0-3])$'
  then raise exception 'avatar-invalido'; end if;
  update public.alunos set apelido = p_apelido, avatar = p_avatar where id = public.aluno_atual();
end $$;

create or replace function public.novo_pin() returns text
language sql volatile set search_path = '' as $$
  select lpad((abs(('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 10000)::text, 4, '0')
$$;
