-- Saída do aluno sem encerrar a sessão anônima.
--
-- O Supabase limita logins anônimos a 30 por hora por IP. Se cada troca de aluno no mesmo
-- computador encerrasse a sessão, uma turma inteira atrás do IP da escola estouraria o limite.
-- Em vez disso, o app mantém a sessão anônima e chama esta função, que desvincula o aluno:
-- a sessão fica sem acesso a nada até o próximo aluno entrar (entrar_aluno revincula).
create function public.aluno_sair() returns void
language sql security definer set search_path = public as $$
  update public.alunos set auth_uid = null where auth_uid = auth.uid();
$$;
revoke all on function public.aluno_sair() from public, anon;
grant execute on function public.aluno_sair() to authenticated;
