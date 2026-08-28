import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { env } from '@/lib/env';

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e
 * Server Actions. Ainda usa a chave "anon" (respeitando RLS) — a
 * diferença é que aqui ele lê/grava a sessão via cookies do Next.js.
 */
export function createServerSupabaseClient(): SupabaseClient<Database> {
  const cookieStore = cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL(),
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chamado a partir de um Server Component sem permissão de escrita;
            // seguro ignorar quando há um middleware cuidando da sessão.
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
}


