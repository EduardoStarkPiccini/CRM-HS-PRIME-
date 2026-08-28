import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** GET /api/leads/:id/history — linha do tempo do lead, mais recente primeiro. */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { data, error } = await supabase
    .from('lead_history')
    .select('id, event_date, description, created_at')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ history: data ?? [] });
}

/** POST /api/leads/:id/history — adiciona um registro manual e atualiza o último contato. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { description } = await request.json();
  if (!description || !String(description).trim()) {
    return NextResponse.json({ error: 'Escreva algo para registrar no histórico.' }, { status: 400 });
  }

  // Confirma (via RLS) que este usuário pode mexer neste lead antes de tocar o histórico.
  const { data: lead } = await supabase.from('leads').select('id').eq('id', params.id).single();
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado ou sem permissão.' }, { status: 404 });

  const { error: histError } = await supabase.from('lead_history').insert({
    lead_id: params.id,
    description: String(description).trim(),
    created_by: user.id,
  });
  if (histError) return NextResponse.json({ error: histError.message }, { status: 400 });

  await supabase
    .from('leads')
    .update({ last_contact_date: new Date().toISOString().slice(0, 10) })
    .eq('id', params.id);

  return NextResponse.json({ ok: true });
}
