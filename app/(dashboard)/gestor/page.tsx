import { redirect } from 'next/navigation';
import { loadDashboardData } from '@/lib/dashboard/data';
import DashboardBoard from '@/components/dashboard/dashboard-board';

export const dynamic = 'force-dynamic';

export default async function GestorDashboard() {
  const data = await loadDashboardData();
  if (!data) redirect('/login');
  if (data.profile.role !== 'gestor') redirect('/vendedor');

  return (
    <DashboardBoard
      profile={{ id: data.profile.id, full_name: data.profile.full_name, role: data.profile.role }}
      leads={data.leads}
      sales={data.sales}
      lossReasons={data.lossReasons}
      vendedores={data.vendedores}
    />
  );
}
