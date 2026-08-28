'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ORIGENS } from '@/lib/leads/constants';
import { ORIGENS_CARRO } from '@/lib/sales/constants';
import { monthLabel, currentMonthKey } from '@/lib/leads/utils';
import { calcStats, filtrarLeads, filtrarVendas, getAnosDisponiveis, getHistoricoMensal, getRelatorioPerdas } from '@/lib/dashboard/calc';
import type { DashboardFilters, LossReason, Sale, Stats, VendedorInfo } from '@/lib/dashboard/types';
import type { Lead } from '@/lib/leads/types';
import NextActionsPanel from '@/components/leads/next-actions-panel';

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type Profile = { id: string; full_name: string; role: 'gestor' | 'vendedor' };

export default function DashboardBoard({
  profile,
  leads,
  sales,
  lossReasons,
  vendedores,
}: {
  profile: Profile;
  leads: Lead[];
  sales: Sale[];
  lossReasons: LossReason[];
  vendedores: VendedorInfo[];
}) {
  const isGestor = profile.role === 'gestor';
  const router = useRouter();
  const [ano, setAno] = useState(currentMonthKey().slice(0, 4));
  const [mes, setMes] = useState(currentMonthKey().slice(5, 7));
  const [vendedorId, setVendedorId] = useState(isGestor ? 'todos' : profile.id);
  const [origemCarro, setOrigemCarro] = useState('todos');
  const [origemLead, setOrigemLead] = useState('todos');
  const [aba, setAba] = useState<'visao' | 'ranking' | 'mensal' | 'comissoes' | 'perdas'>('visao');

  const filtros: DashboardFilters = useMemo(
    () => ({ ano, mes, vendedorId: isGestor ? vendedorId : profile.id, origemCarro, origemLead }),
    [ano, mes, vendedorId, origemCarro, origemLead, isGestor, profile.id]
  );

  const anosDisponiveis = useMemo(() => getAnosDisponiveis(leads, sales), [leads, sales]);
  const leadsFiltrados = useMemo(() => filtrarLeads(leads, filtros), [leads, filtros]);
  const vendasFiltradas = useMemo(() => filtrarVendas(sales, leads, filtros), [sales, leads, filtros]);
  const stats = useMemo(() => calcStats(leadsFiltrados, vendasFiltradas), [leadsFiltrados, vendasFiltradas]);

  const proprios = useMemo(() => (isGestor ? leads : leads.filter((l) => l.assigned_to === profile.id)), [leads, isGestor, profile.id]);

  const cards = isGestor
    ? [
        { l: 'Total de leads', v: stats.totalLeads },
        { l: 'Qualificados', v: stats.qualificados },
        { l: 'Vendas', v: stats.vendidos },
        { l: 'Perdidos', v: stats.perdidos },
        { l: 'Conversão', v: `${stats.taxaConversao.toFixed(1)}%` },
        { l: 'Faturamento', v: fmtBRL(stats.faturamento) },
        { l: 'Ticket médio', v: fmtBRL(stats.ticketMedio) },
        { l: 'Carros vendidos', v: stats.carrosVendidos },
        { l: 'Comissões', v: fmtBRL(stats.comissaoTotal), gold: true },
        { l: 'Carros HS PRIME', v: stats.hsPrime.qtd },
        { l: 'Carros Loja Parceira', v: stats.lojaParceira.qtd },
      ]
    : [
        { l: 'Leads', v: stats.totalLeads },
        { l: 'Qualificados', v: stats.qualificados },
        { l: 'Vendas', v: stats.vendidos },
        { l: 'Perdidos', v: stats.perdidos },
        { l: 'Conversão', v: `${stats.taxaConversao.toFixed(1)}%` },
        { l: 'Ticket médio', v: fmtBRL(stats.ticketMedio) },
        { l: 'Faturamento', v: fmtBRL(stats.faturamento) },
        { l: 'Comissões', v: fmtBRL(stats.comissaoTotal), gold: true },
      ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">{isGestor ? 'Visão geral' : 'Meu painel'}</h1>
        <p className="mt-1 text-sm text-ink-dim">
          {isGestor ? 'Resultado da operação, calculado a partir dos dados reais do banco.' : 'Seus números, sempre atualizados a partir do banco.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={ano} onChange={(e) => setAno(e.target.value)} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-ink outline-none">
          {anosDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-ink outline-none">
          <option value="todos">TODOS OS MESES</option>
          {Array.from({ length: 12 }, (_, i) => {
            const mm = String(i + 1).padStart(2, '0');
            return <option key={mm} value={mm}>{monthLabel(`${ano}-${mm}`)}</option>;
          })}
        </select>
        {isGestor && (
          <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-ink outline-none">
            <option value="todos">TODOS OS VENDEDORES</option>
            {vendedores.map((v) => <option key={v.id} value={v.id}>{v.full_name}</option>)}
          </select>
        )}
        <select value={origemCarro} onChange={(e) => setOrigemCarro(e.target.value)} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-ink outline-none">
          <option value="todos">TODAS AS ORIGENS DE CARRO</option>
          {ORIGENS_CARRO.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={origemLead} onChange={(e) => setOrigemLead(e.target.value)} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-ink outline-none">
          <option value="todos">TODAS AS ORIGENS DE LEAD</option>
          {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {mes === 'todos' && (
        <p className="text-xs text-ink-dim">Mostrando o resultado acumulado de <span className="text-gold">{ano}</span> (todos os meses).</p>
      )}

      <div className={`grid grid-cols-2 gap-3 ${isGestor ? 'sm:grid-cols-4 lg:grid-cols-6' : 'sm:grid-cols-4'}`}>
        {cards.map((c) => (
          <div key={c.l} className="rounded-xl border border-border bg-surface p-4">
            <p className={`font-mono text-xl font-semibold ${c.gold ? 'text-gold' : 'text-ink'}`}>{c.v}</p>
            <p className="mt-1 text-[10.5px] uppercase tracking-wide text-ink-dim">{c.l}</p>
          </div>
        ))}
      </div>

      <NextActionsPanel
        leads={proprios}
        vendedoresPorId={Object.fromEntries(vendedores.map((v) => [v.id, v]))}
        showVendedor={isGestor}
        titulo={isGestor ? 'Próximas ações da equipe' : 'Minhas próximas ações'}
        onOpen={() => router.push(isGestor ? '/gestor/leads' : '/vendedor/leads')}
      />

      {isGestor && (
        <>
          <div className="flex flex-wrap gap-1.5 border-b border-border">
            {[
              { k: 'visao', l: 'Visão Geral' },
              { k: 'ranking', l: 'Ranking' },
              { k: 'mensal', l: 'Histórico Mensal' },
              { k: 'comissoes', l: 'Comissões' },
              { k: 'perdas', l: 'Relatório de Perdas' },
            ].map((t) => (
              <button key={t.k} onClick={() => setAba(t.k as typeof aba)}
                className={`pb-2 pr-4 text-xs font-semibold uppercase tracking-wide ${aba === t.k ? 'border-b-2 border-gold text-ink' : 'text-ink-dim'}`}>
                {t.l}
              </button>
            ))}
          </div>

          {aba === 'ranking' && <RankingTab leads={leads} sales={sales} filtros={filtros} vendedores={vendedores} />}
          {aba === 'mensal' && <MensalTab leads={leads} sales={sales} filtros={filtros} />}
          {aba === 'comissoes' && <ComissoesTab vendas={vendasFiltradas} vendedoresPorId={Object.fromEntries(vendedores.map((v) => [v.id, v]))} />}
          {aba === 'perdas' && <PerdasTab leadsFiltrados={leadsFiltrados} lossReasons={lossReasons} />}
        </>
      )}
    </div>
  );
}

function RankingTab({ leads, sales, filtros, vendedores }: { leads: Lead[]; sales: Sale[]; filtros: DashboardFilters; vendedores: VendedorInfo[] }) {
  const linhas = useMemo(() => {
    return vendedores
      .map((v) => {
        const f = { ...filtros, vendedorId: v.id };
        const s = calcStats(filtrarLeads(leads, f), filtrarVendas(sales, leads, f));
        return { vendedor: v, s };
      })
      .sort((a, b) => b.s.faturamento - a.s.faturamento);
  }, [leads, sales, filtros, vendedores]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-5">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-dim">
            <th className="px-3 py-2">Foto</th><th className="px-3 py-2">Vendedor</th><th className="px-3 py-2">Leads</th>
            <th className="px-3 py-2">Qualif.</th><th className="px-3 py-2">Vendas</th><th className="px-3 py-2">Conversão</th>
            <th className="px-3 py-2">Faturamento</th><th className="px-3 py-2">Comissão</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ vendedor, s }, i) => (
            <tr key={vendedor.id} className="border-b border-border">
              <td className="px-3 py-2.5">
                {vendedor.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendedor.avatar_url} alt={vendedor.full_name} className="h-8 w-8 rounded-full border border-border object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-2 text-[10px] text-ink-dim">
                    {vendedor.full_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </td>
              <td className="px-3 py-2.5 text-ink">{i === 0 && s.faturamento > 0 ? '🏆 ' : ''}{vendedor.full_name}</td>
              <td className="px-3 py-2.5 font-mono text-ink-dim">{s.totalLeads}</td>
              <td className="px-3 py-2.5 font-mono text-ink-dim">{s.qualificados}</td>
              <td className="px-3 py-2.5 font-mono text-ink-dim">{s.vendidos}</td>
              <td className="px-3 py-2.5 font-mono text-ink-dim">{s.taxaConversao.toFixed(1)}%</td>
              <td className="px-3 py-2.5 font-mono text-ink-dim">{fmtBRL(s.faturamento)}</td>
              <td className="px-3 py-2.5 font-mono text-gold">{fmtBRL(s.comissaoTotal)}</td>
            </tr>
          ))}
          {linhas.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-ink-dim">Nenhum vendedor cadastrado.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function MensalTab({ leads, sales, filtros }: { leads: Lead[]; sales: Sale[]; filtros: DashboardFilters }) {
  const linhas = useMemo(() => getHistoricoMensal(leads, sales, filtros), [leads, sales, filtros]);

  function variacao(a: number, b: number) {
    if (!b) return a > 0 ? '+100%' : '0%';
    const v = ((a - b) / b) * 100;
    return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-dim">
              <th className="px-3 py-2">Mês</th><th className="px-3 py-2">Leads</th><th className="px-3 py-2">Qualif.</th>
              <th className="px-3 py-2">Vendas</th><th className="px-3 py-2">Perdidos</th><th className="px-3 py-2">Conversão</th>
              <th className="px-3 py-2">Faturamento</th><th className="px-3 py-2">Comissões</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ mkey, stats: s }) => (
              <tr key={mkey} className="border-b border-border">
                <td className="px-3 py-2.5 text-ink">{monthLabel(mkey)}</td>
                <td className="px-3 py-2.5 font-mono text-ink-dim">{s.totalLeads}</td>
                <td className="px-3 py-2.5 font-mono text-ink-dim">{s.qualificados}</td>
                <td className="px-3 py-2.5 font-mono text-ink-dim">{s.vendidos}</td>
                <td className="px-3 py-2.5 font-mono text-ink-dim">{s.perdidos}</td>
                <td className="px-3 py-2.5 font-mono text-ink-dim">{s.taxaConversao.toFixed(1)}%</td>
                <td className="px-3 py-2.5 font-mono text-ink-dim">{fmtBRL(s.faturamento)}</td>
                <td className="px-3 py-2.5 font-mono text-gold">{fmtBRL(s.comissaoTotal)}</td>
              </tr>
            ))}
            {linhas.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-ink-dim">Sem dados ainda.</td></tr>}
          </tbody>
        </table>
      </div>

      {linhas.length >= 2 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-3 font-display text-sm text-gold">{monthLabel(linhas[0].mkey)} × {monthLabel(linhas[1].mkey)}</h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-dim">
                <th className="px-3 py-2">Métrica</th><th className="px-3 py-2">{monthLabel(linhas[0].mkey)}</th>
                <th className="px-3 py-2">{monthLabel(linhas[1].mkey)}</th><th className="px-3 py-2">Variação</th>
              </tr>
            </thead>
            <tbody>
              {[
                { l: 'Leads', a: linhas[0].stats.totalLeads, b: linhas[1].stats.totalLeads },
                { l: 'Qualificados', a: linhas[0].stats.qualificados, b: linhas[1].stats.qualificados },
                { l: 'Vendas', a: linhas[0].stats.vendidos, b: linhas[1].stats.vendidos },
                { l: 'Conversão (%)', a: linhas[0].stats.taxaConversao, b: linhas[1].stats.taxaConversao },
                { l: 'Faturamento', a: linhas[0].stats.faturamento, b: linhas[1].stats.faturamento, money: true },
                { l: 'Comissões', a: linhas[0].stats.comissaoTotal, b: linhas[1].stats.comissaoTotal, money: true },
              ].map((r) => (
                <tr key={r.l} className="border-b border-border">
                  <td className="px-3 py-2.5 text-ink">{r.l}</td>
                  <td className="px-3 py-2.5 font-mono text-ink-dim">{r.money ? fmtBRL(r.a) : r.a.toFixed ? r.a.toFixed(1) : r.a}</td>
                  <td className="px-3 py-2.5 font-mono text-ink-dim">{r.money ? fmtBRL(r.b) : r.b.toFixed ? r.b.toFixed(1) : r.b}</td>
                  <td className="px-3 py-2.5 font-mono text-gold">{variacao(r.a, r.b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ComissoesTab({ vendas, vendedoresPorId }: { vendas: Sale[]; vendedoresPorId: Record<string, VendedorInfo> }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-5">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-dim">
            <th className="px-3 py-2">Vendedor</th><th className="px-3 py-2">Veículo</th><th className="px-3 py-2">Origem</th>
            <th className="px-3 py-2">Valor</th><th className="px-3 py-2">Comissão</th><th className="px-3 py-2">Data</th>
          </tr>
        </thead>
        <tbody>
          {vendas.map((v) => (
            <tr key={v.id} className="border-b border-border">
              <td className="px-3 py-2.5 text-ink">{vendedoresPorId[v.seller_id ?? '']?.full_name ?? '—'}</td>
              <td className="px-3 py-2.5 text-ink-dim">{v.vehicle}</td>
              <td className="px-3 py-2.5 text-ink-dim">{v.origin ?? '—'}</td>
              <td className="px-3 py-2.5 font-mono text-ink-dim">{fmtBRL(Number(v.sale_value))}</td>
              <td className="px-3 py-2.5 font-mono text-gold">{fmtBRL(Number(v.commission_value ?? 0))}</td>
              <td className="px-3 py-2.5 text-ink-dim">{v.sale_date}</td>
            </tr>
          ))}
          {vendas.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-ink-dim">Nenhuma venda no período/filtro selecionado.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function PerdasTab({ leadsFiltrados, lossReasons }: { leadsFiltrados: Lead[]; lossReasons: LossReason[] }) {
  const linhas = useMemo(() => getRelatorioPerdas(leadsFiltrados, lossReasons), [leadsFiltrados, lossReasons]);
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-5">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-dim">
            <th className="px-3 py-2">Motivo</th><th className="px-3 py-2">Quantidade</th><th className="px-3 py-2">Percentual</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((r) => (
            <tr key={r.reason} className="border-b border-border">
              <td className="px-3 py-2.5 text-ink">{r.reason}</td>
              <td className="px-3 py-2.5 font-mono text-ink-dim">{r.qtd}</td>
              <td className="px-3 py-2.5 font-mono text-ink-dim">{r.pct.toFixed(1)}%</td>
            </tr>
          ))}
          {linhas.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-ink-dim">Sem leads perdidos no período/filtro selecionado.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
