import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Busca tudo que a tela de Leads precisa em uma única passada:
 * o perfil de quem está logado, os leads que ele tem permissão de
 * ver (RLS já filtra: vendedor só os seus, gestor todos) e a lista
 * de vendedores ativos (para exibir nome + preencher o seletor de
 * "vendedor responsável" quando quem está logado é gestor).
 */
export async function loadLeadsPageData() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  const [{ data: leads }, { data: profiles }] = await Promise.all([
    supabase.from('leads').select('*').order('entry_date', { ascending: false }).limit(3000),
    supabase.from('profiles').select('id, full_name, status').eq('status', 'ativo').order('full_name'),
  ]);

  return {
    profile,
    leads: leads ?? [],
    vendedores: profiles ?? [],
  };
}
