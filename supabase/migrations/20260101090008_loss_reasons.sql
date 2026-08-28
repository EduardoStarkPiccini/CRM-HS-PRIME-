-- ============================================================
-- CRM HS PRIME — 0008: loss_reasons
-- Motivo obrigatório quando um lead é movido para "perdido".
-- ============================================================

create table if not exists public.loss_reasons (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  reason text not null check (reason in (
    'Comprou de outra loja', 'Sem dinheiro', 'Financiamento negado',
    'Desistiu', 'Não respondeu', 'Preço', 'Não encontrou o veículo', 'Outro'
  )),
  details text,
  created_at timestamptz not null default now()
);

create index if not exists loss_reasons_lead_id_idx on public.loss_reasons (lead_id);

comment on table public.loss_reasons is 'Motivo de perda de cada lead marcado como "perdido".';
