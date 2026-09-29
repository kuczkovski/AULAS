-- Placar por evolução pessoal: cada aluno é comparado com o próprio histórico,
-- não com os colegas. Nota de 0 a 100 na semana:
--   esforço (até 50): pontos da semana / média das últimas 4 semanas do aluno
--                     (piso de 300 pontos de referência; passa de 150% não rende mais)
--   precisão (até 20): melhora do acerto em relação ao histórico (sem histórico: o acerto da semana)
--   constância (até 30): 6 pontos por dia jogado, no máximo 5 dias
-- Os pontos de cada dia seguem o mesmo teto de 2000 do placar de pontos.

create function public.evolucao_calc(p_turma uuid)
returns table (aluno_id uuid, score integer, pontos bigint, esforco_pct integer, acerto_delta integer, dias integer)
language sql stable security definer set search_path = public as $$
  with sem as (select (date_trunc('week', now() at time zone 'America/Cuiaba'))::date as ini),
  r as (
    select x.aluno_id, x.semana, (x.criada_em at time zone 'America/Cuiaba')::date as dia, x.pontos, x.acertos, x.total
    from public.rodadas x, sem
    where x.turma_id = p_turma and x.tipo <> 'nivelamento' and x.semana >= sem.ini - 28
  ),
  por_dia as (
    select aluno_id, semana, dia, least(sum(pontos), 2000) as pts, sum(acertos) as ac, sum(total) as tt
    from r group by aluno_id, semana, dia
  ),
  por_semana as (
    select aluno_id, semana, sum(pts) as pts, sum(ac) as ac, sum(tt) as tt, count(*) as dias
    from por_dia group by aluno_id, semana
  ),
  atual as (select s.* from por_semana s, sem where s.semana = sem.ini),
  base as (
    select s.aluno_id, avg(s.pts) as pts, sum(s.ac)::numeric / nullif(sum(s.tt), 0) as acc
    from por_semana s, sem where s.semana < sem.ini group by s.aluno_id
  )
  select a.aluno_id,
    round(
      least(a.pts / greatest(coalesce(b.pts, 0), 300), 1.5) / 1.5 * 50
      + case when b.acc is null then (a.ac::numeric / a.tt) * 20
             else greatest(0, least(1, 0.5 + ((a.ac::numeric / a.tt) - b.acc) * 2)) * 20 end
      + least(a.dias, 5) * 6
    )::integer,
    a.pts::bigint,
    round(a.pts / greatest(coalesce(b.pts, 0), 300) * 100)::integer,
    case when b.acc is null then null else round(((a.ac::numeric / a.tt) - b.acc) * 100)::integer end,
    a.dias::integer
  from atual a left join base b on b.aluno_id = a.aluno_id;
$$;

-- Para o aluno: ranking da turma. O detalhe da nota só aparece na linha dele.
create function public.placar_evolucao()
returns table (apelido text, avatar jsonb, nivel integer, score integer, eu boolean, esforco_pct integer, acerto_delta integer, dias integer)
language sql stable security definer set search_path = public as $$
  with eu as (select id, turma_id from public.alunos where auth_uid = auth.uid())
  select a.apelido, a.avatar, coalesce((e.estado ->> 'nivel')::integer, 1), c.score, (a.id = eu.id),
         case when a.id = eu.id then c.esforco_pct end,
         case when a.id = eu.id then c.acerto_delta end,
         case when a.id = eu.id then c.dias end
  from eu
  cross join lateral public.evolucao_calc(eu.turma_id) c
  join public.alunos a on a.id = c.aluno_id
  left join public.estado_aluno e on e.aluno_id = a.id
  where a.apelido is not null
  order by c.score desc, c.pontos desc
  limit 50;
$$;

-- Para o professor: nota e detalhe de todos os alunos da turma.
create function public.professor_evolucao(p_turma uuid)
returns table (aluno_id uuid, score integer, pontos bigint, esforco_pct integer, acerto_delta integer, dias integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eh_professor_da_turma(p_turma) then raise exception 'sem-permissao'; end if;
  return query select * from public.evolucao_calc(p_turma);
end $$;

revoke all on function public.evolucao_calc(uuid), public.placar_evolucao(), public.professor_evolucao(uuid) from public, anon;
revoke execute on function public.evolucao_calc(uuid) from authenticated;
grant execute on function public.placar_evolucao(), public.professor_evolucao(uuid) to authenticated;
