import { createServerSupabaseClient } from '@/lib/supabase/server';

const TABLES = [
  'profiles',
  'leads',
  'lead_history',
  'lead_actions',
  'sales',
  'commission_settings',
  'loss_reasons',
] as const;

export type TableCheck = { table: string; ok: boolean; error?: string };

/**
 * Faz um SELECT leve (count, sem trazer linhas) em cada tabela da base
 * para confirmar que a conexão com o Supabase e as migrations aplicadas
 * estão corretas. Não expõe nenhum dado — apenas confirma existência/acesso.
 */
export async function checkDatabaseHealth() {
  const supabase = createServerSupabaseClient();

  const results: TableCheck[] = await Promise.all(
    TABLES.map(async (table) => {
      const { error } = await supabase.from(table).select('id', { count: 'exact', head: true });
      return { table, ok: !error, error: error?.message };
    })
  );

  return {
    connected: results.every((r) => r.ok),
    tables: results,
    checkedAt: new Date().toISOString(),
  };
}
