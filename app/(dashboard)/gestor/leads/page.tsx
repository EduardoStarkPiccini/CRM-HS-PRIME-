import { redirect } from 'next/navigation';
import { loadLeadsPageData } from '@/lib/leads/data';
import LeadsBoard from '@/components/leads/leads-board';

export const dynamic = 'force-dynamic';

export default async function GestorLeadsPage() {
  const data = await loadLeadsPageData();
  if (!data) redirect('/login');

  return (
    <LeadsBoard
      profile={{ id: data.profile.id, full_name: data.profile.full_name, role: data.profile.role }}
      initialLeads={data.leads}
      vendedores={data.vendedores}
    />
  );
}
