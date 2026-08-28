-- ============================================================
-- CRM HS PRIME — 0014: índice de apoio para listagens por perfil
--
-- As telas de Ranking, filtro de vendedor e o seletor de "vendedor
-- responsável" consultam profiles filtrando por role + status com
-- frequência. Em uma tabela pequena isso nunca seria um problema,
-- mas é uma otimização de custo zero e correta para produção.
-- ============================================================

create index if not exists profiles_role_status_idx on public.profiles (role, status);
