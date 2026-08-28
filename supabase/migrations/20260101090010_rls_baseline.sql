-- ============================================================
-- CRM HS PRIME — 0010: RLS (Row Level Security) — linha de base
--
-- Ativa RLS em todas as tabelas e define as políticas essenciais:
--   - um vendedor só acessa os próprios leads/vendas/ações;
--   - um gestor acessa tudo.
--
-- O login/autenticação completo (Etapa 2) ainda vai definir a UI,
-- mas as políticas abaixo já protegem os dados no nível do banco
-- desde já, para qualquer client que se conectar com a anon key.
-- ============================================================

-- Função utilitária: o usuário autenticado é gestor?
create or replace function public.is_gestor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'gestor' and status = 'ativo'
  );
$$;

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_history enable row level security;
alter table public.lead_actions enable row level security;
alter table public.sales enable row level security;
alter table public.commission_settings enable row level security;
alter table public.loss_reasons enable row level security;

-- ---------- profiles ----------
create policy "profiles: usuário vê o próprio perfil"
  on public.profiles for select
  using (id = auth.uid() or public.is_gestor());

create policy "profiles: usuário atualiza o próprio perfil"
  on public.profiles for update
  using (id = auth.uid() or public.is_gestor());

create policy "profiles: gestor cria perfis"
  on public.profiles for insert
  with check (public.is_gestor() or id = auth.uid());

-- ---------- leads ----------
create policy "leads: vendedor vê os próprios, gestor vê todos"
  on public.leads for select
  using (assigned_to = auth.uid() or public.is_gestor());

create policy "leads: vendedor cria para si, gestor cria para qualquer um"
  on public.leads for insert
  with check (assigned_to = auth.uid() or public.is_gestor());

create policy "leads: vendedor edita os próprios, gestor edita todos"
  on public.leads for update
  using (assigned_to = auth.uid() or public.is_gestor());

create policy "leads: vendedor exclui os próprios, gestor exclui todos"
  on public.leads for delete
  using (assigned_to = auth.uid() or public.is_gestor());

-- ---------- lead_history ----------
create policy "lead_history: segue a permissão do lead"
  on public.lead_history for select
  using (
    public.is_gestor()
    or exists (select 1 from public.leads l where l.id = lead_id and l.assigned_to = auth.uid())
  );

create policy "lead_history: inserir segue a permissão do lead"
  on public.lead_history for insert
  with check (
    public.is_gestor()
    or exists (select 1 from public.leads l where l.id = lead_id and l.assigned_to = auth.uid())
  );

-- ---------- lead_actions ----------
create policy "lead_actions: segue a permissão do lead (select)"
  on public.lead_actions for select
  using (
    public.is_gestor()
    or exists (select 1 from public.leads l where l.id = lead_id and l.assigned_to = auth.uid())
  );

create policy "lead_actions: segue a permissão do lead (insert)"
  on public.lead_actions for insert
  with check (
    public.is_gestor()
    or exists (select 1 from public.leads l where l.id = lead_id and l.assigned_to = auth.uid())
  );

create policy "lead_actions: segue a permissão do lead (update)"
  on public.lead_actions for update
  using (
    public.is_gestor()
    or exists (select 1 from public.leads l where l.id = lead_id and l.assigned_to = auth.uid())
  );

-- ---------- sales ----------
create policy "sales: vendedor vê as próprias, gestor vê todas"
  on public.sales for select
  using (seller_id = auth.uid() or public.is_gestor());

create policy "sales: vendedor registra as próprias, gestor registra todas"
  on public.sales for insert
  with check (seller_id = auth.uid() or public.is_gestor());

create policy "sales: gestor edita/exclui"
  on public.sales for update
  using (public.is_gestor());

create policy "sales: gestor exclui"
  on public.sales for delete
  using (public.is_gestor());

-- ---------- commission_settings ----------
create policy "commission_settings: somente gestor"
  on public.commission_settings for all
  using (public.is_gestor())
  with check (public.is_gestor());

-- ---------- loss_reasons ----------
create policy "loss_reasons: segue a permissão do lead (select)"
  on public.loss_reasons for select
  using (
    public.is_gestor()
    or exists (select 1 from public.leads l where l.id = lead_id and l.assigned_to = auth.uid())
  );

create policy "loss_reasons: segue a permissão do lead (insert)"
  on public.loss_reasons for insert
  with check (
    public.is_gestor()
    or exists (select 1 from public.leads l where l.id = lead_id and l.assigned_to = auth.uid())
  );
