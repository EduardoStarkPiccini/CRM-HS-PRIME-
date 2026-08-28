-- ============================================================
-- CRM HS PRIME — 0005: lead_actions
-- Próximas ações (to-dos) associadas a um lead, com data e
-- status de conclusão — alimenta o painel "Próximas Ações".
-- ============================================================

create table if not exists public.lead_actions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  description text not null,
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists lead_actions_lead_id_idx on public.lead_actions (lead_id);
create index if not exists lead_actions_due_date_idx on public.lead_actions (due_date) where not completed;

comment on table public.lead_actions is 'Tarefas/próximas ações pendentes ou concluídas por lead.';
