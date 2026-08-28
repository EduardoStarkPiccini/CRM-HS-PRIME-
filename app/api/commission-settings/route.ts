import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireGestor } from '@/lib/supabase/require-gestor';
import { ORIGENS_CARRO } from '@/lib/sales/constants';

export const runtime = 'nodejs';

/**
 * PATCH /api/commission-settings
 * Atualiza o valor de comissão vigente para uma origem de carro.
 * A política de RLS já restringe update a gestores, mas confirmamos
 * de novo aqui (requireGestor) para devolver uma mensagem clara em
 * vez de deixar a query simplesmente não afetar nenhuma linha.
 *
 * Vendas já registradas NÃO são alteradas — elas guardam o valor da
 * comissão no momento em que foram criadas (sales.commission_value).
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireGestor();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { car_origin, commission_value } = await request.json();

  if (!ORIGENS_CARRO.includes(car_origin)) {
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 400 });
  }
  const valor = Number(commission_value);
  if (Number.isNaN(valor) || valor < 0) {
    return NextResponse.json({ error: 'Informe um valor de comissão válido.' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('commission_settings')
    .update({ commission_value: valor })
    .eq('car_origin', car_origin)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Não foi possível atualizar.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, setting: data });
}
