-- ============================================================
-- CRM HS PRIME — 0013: comissões por origem do carro
--
-- A tabela "commission_settings" da Etapa 1 foi desenhada de forma
-- genérica (por vendedor, percentual/fixo) antes de sabermos a regra
-- real do negócio. Agora que a regra é simples e fixa por origem do
-- carro (HS PRIME / LOJA PARCEIRA), reconstruímos a tabela do zero —
-- ainda não havia nenhuma venda/comissão real dependendo do formato
-- antigo, então não há dado para migrar.
-- ============================================================

drop table if exists public.commission_settings cascade;

create table public.commission_settings (
  id uuid primary key default gen_random_uuid(),
  car_origin text not null unique check (car_origin in ('HS PRIME', 'LOJA PARCEIRA')),
  commission_value numeric(10, 2) not null check (commission_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_commission_settings_updated_at
  before update on public.commission_settings
  for each row execute function public.set_updated_at();

insert into public.commission_settings (car_origin, commission_value) values
  ('HS PRIME', 900.00),
  ('LOJA PARCEIRA', 500.00);

alter table public.commission_settings enable row level security;

-- Qualquer pessoa autenticada e ativa pode CONSULTAR os valores atuais
-- (o vendedor não define/edita, mas é razoável que veja a regra vigente).
create policy "commission_settings: leitura para qualquer usuário autenticado"
  on public.commission_settings for select
  using (auth.uid() is not null);

-- Somente o gestor pode alterar os valores.
create policy "commission_settings: somente gestor altera"
  on public.commission_settings for all
  using (public.is_gestor())
  with check (public.is_gestor());

comment on table public.commission_settings is 'Valor de comissão vigente por origem do carro. Vendas gravam o valor no momento (sales.commission_value) e não são afetadas por mudanças futuras aqui.';
