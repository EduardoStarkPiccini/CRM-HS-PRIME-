import { Card, CardTitle } from '@/components/ui/card';

type TableCheck = {
  table: string;
  ok: boolean;
  error?: string;
};

type HealthResult = {
  connected: boolean;
  tables: TableCheck[];
  checkedAt: string;
};

async function getHealth(): Promise<HealthResult | { connected: false; error: string }> {
  try {
    // Import local direto (Server Component) evita uma volta de rede extra
    // até a própria rota /api/health durante o SSR.
    const { checkDatabaseHealth } = await import('@/lib/supabase/health');
    return await checkDatabaseHealth();
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao checar o Supabase.',
    };
  }
}

export default async function SystemStatus() {
  const health = await getHealth();

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <CardTitle>Status da base</CardTitle>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            health.connected
              ? 'bg-gold/10 text-gold'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {health.connected ? 'Supabase conectado' : 'Sem conexão'}
        </span>
      </div>

      {!health.connected && (
        <p className="text-sm text-ink-dim">
          {'error' in health ? health.error : 'Não foi possível confirmar a conexão.'}{' '}
          Confira as variáveis de ambiente em <code className="text-gold">.env.local</code> (veja{' '}
          <code className="text-gold">.env.example</code>).
        </p>
      )}

      {health.connected && 'tables' in health && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {health.tables.map((t) => (
            <li
              key={t.table}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
            >
              <span className="text-ink-dim">{t.table}</span>
              <span className={t.ok ? 'text-gold' : 'text-red-400'}>{t.ok ? '✓' : '✕'}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
