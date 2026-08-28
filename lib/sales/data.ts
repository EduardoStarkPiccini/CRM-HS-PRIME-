import { createServerSupabaseClient } from '@/lib/supabase/server';

/** Vendas do vendedor logado (RLS já restringe a seller_id = auth.uid()). */
export async function loadMinhasVendas() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sales } = await supabase
    .from('sales')
    .select('*')
    .order('sale_date', { ascending: false });

  return { sales: sales ?? [] };
}

/** Todas as vendas + mapa de vendedores, para a tela de Comissões do gestor. */
export async function loadComissoesGestor() {
  const supabase = createServerSupabaseClient();

  const [{ data: sales }, { data: vendedores }] = await Promise.all([
    supabase.from('sales').select('*').order('sale_date', { ascending: false }),
    supabase.from('profiles').select('id, full_name').order('full_name'),
  ]);

  return { sales: sales ?? [], vendedores: vendedores ?? [] };
}

/** Valores de comissão vigentes por origem do carro. */
export async function loadCommissionSettings() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from('commission_settings').select('*').order('car_origin');
  return data ?? [];
}
