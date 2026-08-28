import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Confirma, a partir da sessão (cookies) da própria requisição, que quem
 * está chamando a rota é um gestor ativo. Usado no início de toda rota
 * administrativa antes de qualquer operação com a service role.
 */
export async function requireGestor() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: 'Não autenticado.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status !== 'ativo' || profile.role !== 'gestor') {
    return { ok: false as const, status: 403, error: 'Acesso restrito ao gestor.' };
  }

  return { ok: true as const, userId: user.id };
}
