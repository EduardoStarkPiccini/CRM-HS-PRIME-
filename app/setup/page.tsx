import { createAdminClient } from '@/lib/supabase/admin';
import SetupForm from '@/components/auth/setup-form';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'gestor');

  const jaConfigurado = (count ?? 0) > 0;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-gold">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-gold/40 bg-gradient-to-br from-gold-dark to-gold font-display text-lg font-bold text-black">
            HS
          </div>
          <h1 className="font-display text-xl tracking-wide text-ink">Configuração inicial</h1>
          <p className="mt-1 text-xs text-ink-dim">Criação do gestor principal do CRM HS PRIME</p>
        </div>

        {jaConfigurado ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-ink-dim">
              Este CRM já tem um gestor cadastrado. Novos usuários agora são criados
              pelo próprio painel, em <span className="text-gold">Equipe</span>.
            </div>
            <Link href="/login" className="block text-sm text-gold underline">
              Ir para o login
            </Link>
          </div>
        ) : (
          <SetupForm />
        )}
      </div>
    </main>
  );
}
