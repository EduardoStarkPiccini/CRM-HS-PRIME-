-- ============================================================
-- CRM HS PRIME — 0004: lead_history
-- Linha do tempo (jornada) de cada lead: mudanças de etapa,
-- contatos, observações relevantes.
-- ============================================================

create table if not exists public.lead_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  event_date date not null default current_date,
  description text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists lead_history_lead_id_idx on public.lead_history (lead_id);

comment on table public.lead_history is 'Histórico cronológico de eventos de cada lead.';
