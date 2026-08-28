import { redirect } from 'next/navigation';
import { loadMinhasVendas } from '@/lib/sales/data';
import { Card, CardTitle } from '@/components/ui/card';
import { fmtDateShort } from '@/lib/leads/utils';

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const dynamic = 'force-dynamic';

export default async function MinhasVendasPage() {
  const data = await loadMinhasVendas();
  if (!data) redirect('/login');

  const { sales } = data;
  const totalValor = sales.reduce((s, v) => s + Number(v.sale_value || 0), 0);
  const totalComissao = sales.reduce((s, v) => s + Number(v.commission_value || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Minhas vendas</h1>
        <p className="mt-1 text-sm text-ink-dim">Carros vendidos, valores e comissões que você já garantiu.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardTitle>Carros vendidos</CardTitle><p className="mt-2 font-mono text-3xl text-ink">{sales.length}</p></Card>
        <Card><CardTitle>Valor total</CardTitle><p className="mt-2 font-mono text-2xl text-ink">{fmtBRL(totalValor)}</p></Card>
        <Card><CardTitle>Comissões</CardTitle><p className="mt-2 font-mono text-2xl text-gold">{fmtBRL(totalComissao)}</p></Card>
      </div>

      <Card>
        <CardTitle>Detalhamento</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-dim">
                <th className="px-3 py-2">Veículo</th>
                <th className="px-3 py-2">Origem</th>
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Comissão</th>
                <th className="px-3 py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((v) => (
                <tr key={v.id} className="border-b border-border">
                  <td className="px-3 py-3 text-ink">{v.vehicle}</td>
                  <td className="px-3 py-3 text-ink-dim">{v.origin ?? '—'}</td>
                  <td className="px-3 py-3 font-mono text-ink-dim">{fmtBRL(Number(v.sale_value))}</td>
                  <td className="px-3 py-3 font-mono text-gold">{fmtBRL(Number(v.commission_value ?? 0))}</td>
                  <td className="px-3 py-3 text-ink-dim">{fmtDateShort(v.sale_date)}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-ink-dim">Nenhuma venda registrada ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
