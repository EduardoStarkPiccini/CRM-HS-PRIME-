-- ============================================================
-- CRM HS PRIME — 0002: profiles
-- Um perfil por usuário autenticado (auth.users). Guarda nome,
-- perfil de acesso (vendedor/gestor), status e foto (Storage).
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'vendedor' check (role in ('vendedor', 'gestor')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

comment on table public.profiles is 'Vendedores e gestores que usam o CRM HS PRIME.';
