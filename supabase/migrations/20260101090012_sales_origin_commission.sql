-- ============================================================
-- CRM HS PRIME — 0012: vendas — origem do carro + comissão travada
--
-- Adiciona à tabela "sales":
--   - origin: de onde veio o carro vendido (HS PRIME / LOJA PARCEIRA)
--   - commission_value: o valor da comissão NAQUELE momento da venda
--     (snapshot — se a regra mudar depois, vendas antigas não mudam)
--
-- O índice único garante, no próprio banco, que um lead não pode ter
-- duas vendas registradas (reenvio do formulário não duplica).
-- ============================================================

alter table public.sales
  add column if not exists origin text check (origin is null or origin in ('HS PRIME', 'LOJA PARCEIRA')),
  add column if not exists commission_value numeric(10, 2);

create unique index if not exists sales_lead_id_unique
  on public.sales (lead_id)
  where lead_id is not null;

comment on column public.sales.origin is 'Origem do carro vendido: HS PRIME ou LOJA PARCEIRA — define a regra de comissão aplicada.';
comment on column public.sales.commission_value is 'Valor da comissão travado no momento da venda (não muda se a regra mudar depois).';
