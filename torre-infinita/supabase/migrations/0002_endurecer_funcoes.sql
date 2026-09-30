-- Reduz a superfície da API: funções internas não ficam chamáveis pelo cliente.
-- (aluno_atual e eh_professor_da_turma continuam liberadas: as políticas de RLS as usam.)
alter function public.novo_pin() set search_path = '';
revoke execute on function public.rodada_preencher() from public, anon, authenticated;
revoke execute on function public.apelido_valido(text) from public, anon, authenticated;
revoke execute on function public.novo_pin() from public, anon, authenticated;
