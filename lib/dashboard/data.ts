import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Busca tudo que os dashboards/relatórios precisam em uma passada só.
 * RLS já cuida do escopo: vendedor recebe só os próprios leads/vendas;
 * gestor recebe tudo. Nenhum número é calculado aqui — só dados brutos;
 * os cálculos ficam em lib/dashboard/calc.ts, para não duplicar lógica
 * entre o painel do vendedor e a visão geral do gestor.
 */
export async function loadDashboardData() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();
  if (!profile) return null;

  const [{ data: leads }, { data: sales }, { data: lossReasons }, { data: vendedores }] = await Promise.all([
    supabase.from('leads').select('*').limit(3000),
    supabase.from('sales').select('*').limit(3000),
    supabase.from('loss_reasons').select('id, lead_id, reason').limit(3000),
    supabase.from('profiles').select('id, full_name, avatar_url').eq('role', 'vendedor').eq('status', 'ativo').order('full_name'),
  ]);

  return {
    profile,
    leads: leads ?? [],
    sales: sales ?? [],
    lossReasons: lossReasons ?? [],
    vendedores: vendedores ?? [],
  };
}
