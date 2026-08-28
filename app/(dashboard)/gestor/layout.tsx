import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import DashboardHeader from '@/components/dashboard/header';

/**
 * Guarda de defesa em profundidade: o middleware.ts já bloqueia
 * vendedores de chegar em /gestor/**, mas checamos de novo aqui,
 * direto no servidor, para o caso de o middleware não rodar
 * (ex.: alguma configuração futura de matcher).
 */
export default async function GestorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status !== 'ativo') redirect('/login');
  if (profile.role !== 'gestor') redirect('/vendedor');

  return (
    <div className="min-h-screen">
      <DashboardHeader
        nome={profile.full_name}
        perfil="gestor"
        links={[
          { href: '/gestor', label: 'Dashboard' },
          { href: '/gestor/leads', label: 'Leads' },
          { href: '/gestor/equipe', label: 'Equipe' },
          { href: '/gestor/configuracoes', label: 'Configurações' },
        ]}
      />
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
