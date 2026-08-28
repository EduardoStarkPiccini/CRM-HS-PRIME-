import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { env } from '@/lib/env';

/**
 * Cliente Supabase com a SERVICE ROLE KEY.
 *
 * ⚠️ SOMENTE PARA USO NO SERVIDOR.
 * O pacote "server-only" faz o build FALHAR caso este arquivo seja
 * importado, direta ou indiretamente, por qualquer Client Component.
 *
 * A service role ignora completamente as políticas de RLS — use apenas
 * em rotas administrativas (ex.: app/api/**\/route.ts) que precisem
 * criar usuários, ajustar dados entre vendedores, etc.
 */

let adminClient: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  if (adminClient) return adminClient;

  adminClient = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL(),
    env.SUPABASE_SERVICE_ROLE_KEY(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return adminClient;
}
