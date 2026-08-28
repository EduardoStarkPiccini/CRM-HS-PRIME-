import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import DashboardHeader from '@/components/dashboard/header';

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status !== 'ativo') redirect('/login');
  if (profile.role !== 'vendedor') redirect('/gestor');

  return (
    <div className="min-h-screen">
      <DashboardHeader
        nome={profile.full_name}
        perfil="vendedor"
        links={[
          { href: '/vendedor', label: 'Dashboard' },
          { href: '/vendedor/leads', label: 'Leads' },
          { href: '/vendedor/vendas', label: 'Minhas Vendas' },
        ]}
      />
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
