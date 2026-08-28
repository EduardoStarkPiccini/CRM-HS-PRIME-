-- ============================================================
-- CRM HS PRIME — 0003: leads
-- Cada lead pertence a um vendedor (assigned_to) e percorre o
-- funil: lead -> qualificado -> vendido / perdido.
-- ============================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text,
  car_interest text,
  origin text check (
    origin is null or origin in (
      'Facebook Ads', 'Instagram Ads', 'Facebook Marketplace',
      'Instagram', 'WhatsApp', 'Indicação', 'Orgânico', 'Outro'
    )
  ),
  stage text not null default 'lead' check (stage in ('lead', 'qualificado', 'vendido', 'perdido')),
  assigned_to uuid references public.profiles (id) on delete set null,
  entry_date date not null default current_date,
  last_contact_date date,
  next_action text,
  next_action_date date,
  probability text check (probability is null or probability in ('baixa', 'média', 'alta')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_assigned_to_idx on public.leads (assigned_to);
create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_entry_date_idx on public.leads (entry_date);

create trigger set_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

comment on table public.leads is 'Clientes/leads em qualquer etapa do funil comercial.';
comment on column public.leads.entry_date is 'Define automaticamente a qual mês o lead pertence nos relatórios.';
