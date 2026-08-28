import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ORIGENS_CARRO } from '@/lib/sales/constants';

export const runtime = 'nodejs';

/**
 * POST /api/leads/:id/sale
 *
 * Registra a venda de um lead, em um único fluxo:
 *   1. confirma que ainda não existe venda para este lead (não duplica
 *      se o formulário for reenviado — e o banco também garante isso
 *      com um índice único em sales.lead_id, como segunda trava);
 *   2. busca a comissão VIGENTE para a origem do carro escolhida e a
 *      grava junto da venda (snapshot: mudanças futuras na regra não
 *      afetam vendas já registradas);
 *   3. move o lead para "vendido" (se ainda não estiver);
 *   4. registra tudo no histórico do cliente.
 *
 * Continua usando o cliente da SESSÃO — a política de RLS de "sales"
 * já garante que um vendedor só registra vendas para si mesmo
 * (seller_id = auth.uid()), e a de "leads" que só edita os próprios.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { id: leadId } = params;
  const body = await request.json();
  const { sale_date, vehicle, sale_value, origin, notes } = body ?? {};

  if (!vehicle || !String(vehicle).trim()) {
    return NextResponse.json({ error: 'Informe o veículo vendido.' }, { status: 400 });
  }
  const valor = Number(sale_value);
  if (!valor || valor <= 0) {
    return NextResponse.json({ error: 'Informe um valor de venda válido.' }, { status: 400 });
  }
  if (!ORIGENS_CARRO.includes(origin)) {
    return NextResponse.json({ error: 'Selecione a origem do carro.' }, { status: 400 });
  }

  const { data: lead } = await supabase.from('leads').select('id, stage, assigned_to').eq('id', leadId).single();
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado ou sem permissão.' }, { status: 404 });

  const { data: vendaExistente } = await supabase.from('sales').select('id').eq('lead_id', leadId).maybeSingle();
  if (vendaExistente) {
    return NextResponse.json({ error: 'Já existe uma venda registrada para este cliente.' }, { status: 409 });
  }

  const { data: regra } = await supabase
    .from('commission_settings')
    .select('commission_value')
    .eq('car_origin', origin)
    .single();
  const comissao = regra?.commission_value ?? 0;

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      lead_id: leadId,
      seller_id: lead.assigned_to,
      vehicle: String(vehicle).trim(),
      sale_value: valor,
      sale_date: sale_date || new Date().toISOString().slice(0, 10),
      origin,
      commission_value: comissao,
      notes: notes || null,
    })
    .select()
    .single();

  if (saleError || !sale) {
    // índice único de sales.lead_id pega uma corrida de duplo-clique aqui também
    const duplicado = saleError?.message?.toLowerCase().includes('duplicate');
    return NextResponse.json(
      { error: duplicado ? 'Já existe uma venda registrada para este cliente.' : (saleError?.message ?? 'Não foi possível registrar a venda.') },
      { status: duplicado ? 409 : 400 }
    );
  }

  let updatedLead = lead;
  if (lead.stage !== 'vendido') {
    const { data: novoLead } = await supabase
      .from('leads')
      .update({ stage: 'vendido' })
      .eq('id', leadId)
      .select()
      .single();
    if (novoLead) updatedLead = novoLead;

    await supabase.from('lead_history').insert({
      lead_id: leadId,
      description: 'Movido para VENDIDO',
      created_by: user.id,
    });
  }

  await supabase.from('lead_history').insert({
    lead_id: leadId,
    description: `Venda registrada: ${sale.vehicle} — R$ ${valor.toFixed(2)} (${origin}) — comissão R$ ${comissao.toFixed(2)}`,
    created_by: user.id,
  });

  const { data: leadFinal } = await supabase.from('leads').select('*').eq('id', leadId).single();

  return NextResponse.json({ ok: true, sale, lead: leadFinal ?? updatedLead });
}
