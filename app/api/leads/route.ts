import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ORIGENS, STAGE_KEYS } from '@/lib/leads/constants';

export const runtime = 'nodejs';

/**
 * POST /api/leads
 * Cria um lead novo. Usa o cliente Supabase da SESSÃO (não a service
 * role) de propósito: assim, a política de RLS de "leads" já garante
 * sozinha que um vendedor só consegue criar leads com assigned_to =
 * o próprio auth.uid() — a rota não precisa reimplementar essa regra,
 * só confia no banco.
 */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const body = await request.json();
  const {
    name, whatsapp, car_interest, origin, assigned_to,
    stage, next_action, next_action_date, notes, entry_date,
  } = body ?? {};

  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: 'Informe o nome do cliente.' }, { status: 400 });
  }
  if (origin && !ORIGENS.includes(origin)) {
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 400 });
  }
  if (stage && !STAGE_KEYS.includes(stage)) {
    return NextResponse.json({ error: 'Etapa inválida.' }, { status: 400 });
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      name: String(name).trim(),
      whatsapp: whatsapp || null,
      car_interest: car_interest || null,
      origin: origin || null,
      assigned_to: assigned_to || user.id,
      stage: stage || 'lead',
      next_action: next_action || null,
      next_action_date: next_action_date || null,
      notes: notes || null,
      entry_date: entry_date || new Date().toISOString().slice(0, 10),
      last_contact_date: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: error?.message ?? 'Não foi possível criar o lead.' }, { status: 400 });
  }

  await supabase.from('lead_history').insert({
    lead_id: lead.id,
    description: `Lead cadastrado (${origin || 'Origem não informada'})`,
    created_by: user.id,
  });

  return NextResponse.json({ ok: true, lead });
}
