-- ============================================================
-- CRM HS PRIME — 0007: commission_settings
-- Regras de comissão por vendedor (ou uma regra padrão quando
-- seller_id é nulo). Preparado para a etapa de comissões.
-- ============================================================

create table if not exists public.commission_settings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles (id) on delete cascade,
  commission_type text not null default 'percentual' check (commission_type in ('percentual', 'fixo')),
  commission_value numeric(10, 2) not null default 0 check (commission_value >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists commission_settings_one_default
  on public.commission_settings ((seller_id is null))
  where seller_id is null;

create trigger set_commission_settings_updated_at
  before update on public.commission_settings
  for each row execute function public.set_updated_at();

comment on table public.commission_settings is 'Regras de comissão global (seller_id nulo) ou individuais por vendedor.';
