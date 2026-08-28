import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MOTIVOS_PERDA, STAGE_KEYS, STAGE_LABEL } from '@/lib/leads/constants';
import type { Database, LeadStage, Probability } from '@/types/database.types';

export const runtime = 'nodejs';

/**
 * PATCH /api/leads/:id
 * Atualiza um lead (dados gerais, mudança de etapa, próxima ação).
 * Continua usando o cliente da sessão — se o lead não pertencer ao
 * vendedor que está chamando, o RLS simplesmente não encontra/atualiza
 * a linha, e devolvemos 404 (não vazamos se o lead existe ou não).
 *
 * Se a etapa for alterada, registra automaticamente no lead_history.
 * Se a nova etapa for "perdido", exige o motivo e grava em loss_reasons.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { id } = params;
  const body = await request.json();

  const { data: existing } = await supabase.from('leads').select('stage').eq('id', id).single();
  if (!existing) {
    return NextResponse.json({ error: 'Lead não encontrado ou sem permissão.' }, { status: 404 });
  }

  const update: Database['public']['Tables']['leads']['Update'] = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.whatsapp !== undefined) update.whatsapp = body.whatsapp || null;
  if (body.car_interest !== undefined) update.car_interest = body.car_interest || null;
  if (body.origin !== undefined) update.origin = body.origin || null;
  if (body.assigned_to !== undefined) update.assigned_to = body.assigned_to || null;
  if (body.next_action !== undefined) update.next_action = body.next_action || null;
  if (body.next_action_date !== undefined) update.next_action_date = body.next_action_date || null;
  if (body.notes !== undefined) update.notes = body.notes || null;
  if (body.entry_date !== undefined) update.entry_date = body.entry_date;
  if (body.probability !== undefined) update.probability = (body.probability as Probability) || null;

  let novaEtapa: LeadStage | undefined;
  if (body.stage !== undefined && body.stage !== existing.stage) {
    if (!STAGE_KEYS.includes(body.stage)) {
      return NextResponse.json({ error: 'Etapa inválida.' }, { status: 400 });
    }
    if (body.stage === 'perdido') {
      if (!body.motivoPerda || !MOTIVOS_PERDA.includes(body.motivoPerda)) {
        return NextResponse.json({ error: 'Selecione o motivo da perda.' }, { status: 400 });
      }
    }
    novaEtapa = body.stage as LeadStage;
    update.stage = body.stage as LeadStage;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 });
  }


  const { data: lead, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: error?.message ?? 'Não foi possível atualizar o lead.' }, { status: 400 });
  }

  if (novaEtapa) {
    await supabase.from('lead_history').insert({
      lead_id: id,
      description: `Movido para ${STAGE_LABEL[novaEtapa]}`,
      created_by: user.id,
    });
    if (novaEtapa === 'perdido') {
      await supabase.from('loss_reasons').insert({
        lead_id: id,
        reason: body.motivoPerda,
        details: body.motivoDetalhes || null,
      });
      await supabase.from('lead_history').insert({
        lead_id: id,
        description: `Motivo da perda: ${body.motivoPerda}`,
        created_by: user.id,
      });
    }
  }

  return NextResponse.json({ ok: true, lead });
}
