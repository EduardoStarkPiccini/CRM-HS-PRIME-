'use client';

/**
 * Cliente Supabase para uso no browser (Client Components).
 * Usa apenas a chave pública "anon" — segura para expor no frontend,
 * pois o acesso real aos dados é controlado pelas políticas de RLS
 * definidas nas migrations (supabase/migrations).
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { env } from '@/lib/env';

export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL(),
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY()
  ) as unknown as SupabaseClient<Database>;
}



