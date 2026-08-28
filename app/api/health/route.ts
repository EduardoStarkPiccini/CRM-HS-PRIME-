import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/supabase/health';

/**
 * GET /api/health
 * Endpoint simples para confirmar (via curl, Vercel, monitoramento, etc.)
 * que o projeto está no ar e conectado ao Supabase com as tabelas da
 * base já aplicadas.
 */
export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    return NextResponse.json(health, { status: health.connected ? 200 : 503 });
  } catch (err) {
    return NextResponse.json(
      {
        connected: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido.',
      },
      { status: 500 }
    );
  }
}
