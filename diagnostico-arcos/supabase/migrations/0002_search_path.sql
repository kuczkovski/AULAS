-- Fixa o search_path das funções auxiliares (aviso do linter de segurança do Supabase).
alter function public.duracao_prova() set search_path = '';
alter function public._tolerancia() set search_path = '';
alter function public._nivel(numeric) set search_path = '';
alter function public._chave_nome(text) set search_path = '';
