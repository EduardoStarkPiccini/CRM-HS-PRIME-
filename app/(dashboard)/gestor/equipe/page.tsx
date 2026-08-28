import { createServerSupabaseClient } from '@/lib/supabase/server';
import TeamList from '@/components/team/team-list';

export const dynamic = 'force-dynamic';

export default async function EquipePage() {
  const supabase = createServerSupabaseClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, status, avatar_url, phone')
    .order('full_name');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Equipe</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Crie vendedores, edite dados e ative/desative acessos. Desativar bloqueia o login,
          mas nunca apaga leads, vendas, comissões ou histórico já registrados.
        </p>
      </div>

      <TeamList initialProfiles={profiles ?? []} />
    </div>
  );
}
