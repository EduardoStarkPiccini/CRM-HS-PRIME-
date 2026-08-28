-- ============================================================
-- CRM HS PRIME — 0006: sales
-- Registro de vendas concluídas, vinculado ao lead e ao
-- vendedor responsável. Alimenta faturamento e ticket médio.
-- ============================================================

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  seller_id uuid references public.profiles (id) on delete set null,
  vehicle text not null,
  sale_value numeric(12, 2) not null check (sale_value >= 0),
  sale_date date not null default current_date,
  payment_method text,
  down_payment numeric(12, 2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists sales_seller_id_idx on public.sales (seller_id);
create index if not exists sales_sale_date_idx on public.sales (sale_date);

comment on table public.sales is 'Vendas concretizadas — base de faturamento e comissionamento.';
