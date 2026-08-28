import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

/**
 * Atualiza (refresh) a sessão do Supabase a cada requisição e devolve
 * tanto a resposta (com os cookies renovados) quanto um cliente pronto
 * para consultas — usado pelo middleware.ts para checar sessão + perfil.
 */
export function createMiddlewareClient(request: NextRequest): {
  supabase: SupabaseClient<Database>;
  getResponse: () => NextResponse;
} {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;

  return { supabase, getResponse: () => response };
}



