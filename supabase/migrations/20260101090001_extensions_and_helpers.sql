-- ============================================================
-- CRM HS PRIME — 0001: extensões e função utilitária
-- ============================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Mantém "updated_at" sempre atualizado automaticamente.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
