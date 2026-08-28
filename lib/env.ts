/**
 * Validação central das variáveis de ambiente do CRM HS PRIME.
 * Lança um erro claro em build/runtime caso alguma variável obrigatória
 * não tenha sido configurada, em vez de falhar silenciosamente.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `[CRM HS PRIME] Variável de ambiente ausente: ${name}. ` +
      `Confira o arquivo .env.example e configure em .env.local (local) ` +
      `ou nas Environment Variables do projeto na Vercel.`
    );
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: () =>
    required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: () =>
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  // Somente para uso em código server-side (route handlers, server actions).
  SUPABASE_SERVICE_ROLE_KEY: () =>
    required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  // Somente para uso em código server-side — protege a rota /setup.
  SETUP_ADMIN_SECRET: () =>
    required('SETUP_ADMIN_SECRET', process.env.SETUP_ADMIN_SECRET),
};
