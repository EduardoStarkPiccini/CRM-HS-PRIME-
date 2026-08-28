import type { Lead } from '@/lib/leads/types';
import type { DashboardFilters, LossReason, Sale, Stats } from '@/lib/dashboard/types';

/**
 * Critério único de "mês" usado em todo o relatório: o mês de uma
 * VENDA é o mês de ENTRADA do lead que originou aquela venda (não a
 * data em que a venda foi fechada). Isso mantém a mesma classificação
 * mensal estabelecida desde a Etapa 3 — um lead nunca "muda de mês"
 * conforme anda pelo funil, e os relatórios ficam coerentes entre si
 * (o mesmo lead conta como a mesma "safra" em todo lugar).
 */
function monthKey(iso: string | null | undefined) {
  return iso && iso.length >= 7 ? iso.slice(0, 7) : '';
}

function saleMonthKey(sale: Sale, leadsById: Map<string, Lead>) {
  const lead = sale.lead_id ? leadsById.get(sale.lead_id) : undefined;
  return monthKey(lead?.entry_date ?? sale.sale_date);
}

function periodoBate(mkey: string, ano: string, mes: string) {
  if (!mkey) return false;
  if (mkey.slice(0, 4) !== ano) return false;
  if (mes === 'todos') return true;
  return mkey.slice(5, 7) === mes;
}

export function filtrarLeads(leads: Lead[], f: DashboardFilters): Lead[] {
  return leads.filter((l) => {
    if (!periodoBate(monthKey(l.entry_date), f.ano, f.mes)) return false;
    if (f.vendedorId !== 'todos' && l.assigned_to !== f.vendedorId) return false;
    if (f.origemLead !== 'todos' && l.origin !== f.origemLead) return false;
    return true;
  });
}

export function filtrarVendas(sales: Sale[], leads: Lead[], f: DashboardFilters): Sale[] {
  const leadsById = new Map(leads.map((l) => [l.id, l]));
  return sales.filter((s) => {
    const mkey = saleMonthKey(s, leadsById);
    if (!periodoBate(mkey, f.ano, f.mes)) return false;
    if (f.vendedorId !== 'todos' && s.seller_id !== f.vendedorId) return false;
    if (f.origemCarro !== 'todos' && s.origin !== f.origemCarro) return false;
    if (f.origemLead !== 'todos') {
      const lead = s.lead_id ? leadsById.get(s.lead_id) : undefined;
      if (!lead || lead.origin !== f.origemLead) return false;
    }
    return true;
  });
}

export function calcStats(leadsFiltrados: Lead[], vendasFiltradas: Sale[]): Stats {
  const totalLeads = leadsFiltrados.length;
  const qualificados = leadsFiltrados.filter((l) => l.stage === 'qualificado').length;
  const vendidos = leadsFiltrados.filter((l) => l.stage === 'vendido').length;
  const perdidos = leadsFiltrados.filter((l) => l.stage === 'perdido').length;
  const taxaConversao = totalLeads ? (vendidos / totalLeads) * 100 : 0;

  const carrosVendidos = vendasFiltradas.length;
  const faturamento = vendasFiltradas.reduce((s, v) => s + Number(v.sale_value || 0), 0);
  const comissaoTotal = vendasFiltradas.reduce((s, v) => s + Number(v.commission_value || 0), 0);
  const ticketMedio = carrosVendidos ? faturamento / carrosVendidos : 0;

  function porOrigem(origem: string) {
    const subset = vendasFiltradas.filter((v) => v.origin === origem);
    return {
      qtd: subset.length,
      faturamento: subset.reduce((s, v) => s + Number(v.sale_value || 0), 0),
      comissao: subset.reduce((s, v) => s + Number(v.commission_value || 0), 0),
    };
  }

  return {
    totalLeads, qualificados, vendidos, perdidos, taxaConversao,
    carrosVendidos, faturamento, ticketMedio, comissaoTotal,
    hsPrime: porOrigem('HS PRIME'),
    lojaParceira: porOrigem('LOJA PARCEIRA'),
  };
}

export function getAnosDisponiveis(leads: Lead[], sales: Sale[]): string[] {
  const set = new Set<string>();
  leads.forEach((l) => { if (l.entry_date) set.add(l.entry_date.slice(0, 4)); });
  sales.forEach((s) => { if (s.sale_date) set.add(s.sale_date.slice(0, 4)); });
  set.add(new Date().toISOString().slice(0, 4));
  return Array.from(set).sort();
}

/** Um mês por linha, para "Histórico mensal" — respeita vendedor/origens, ignora ano/mês do filtro. */
export function getHistoricoMensal(leads: Lead[], sales: Sale[], f: DashboardFilters) {
  const leadsById = new Map(leads.map((l) => [l.id, l]));
  const meses = new Set<string>();
  leads.forEach((l) => { const k = monthKey(l.entry_date); if (k) meses.add(k); });
  sales.forEach((s) => { const k = saleMonthKey(s, leadsById); if (k) meses.add(k); });

  const linhas = Array.from(meses).sort().reverse().map((mkey) => {
    const leadsDoMes = leads.filter((l) => {
      if (monthKey(l.entry_date) !== mkey) return false;
      if (f.vendedorId !== 'todos' && l.assigned_to !== f.vendedorId) return false;
      if (f.origemLead !== 'todos' && l.origin !== f.origemLead) return false;
      return true;
    });
    const vendasDoMes = sales.filter((s) => {
      if (saleMonthKey(s, leadsById) !== mkey) return false;
      if (f.vendedorId !== 'todos' && s.seller_id !== f.vendedorId) return false;
      if (f.origemCarro !== 'todos' && s.origin !== f.origemCarro) return false;
      if (f.origemLead !== 'todos') {
        const lead = s.lead_id ? leadsById.get(s.lead_id) : undefined;
        if (!lead || lead.origin !== f.origemLead) return false;
      }
      return true;
    });
    return { mkey, stats: calcStats(leadsDoMes, vendasDoMes) };
  });

  return linhas;
}

export function getRelatorioPerdas(leadsFiltrados: Lead[], lossReasons: LossReason[]) {
  const idsPerdidos = new Set(leadsFiltrados.filter((l) => l.stage === 'perdido').map((l) => l.id));
  const contagem: Record<string, number> = {};
  lossReasons.forEach((lr) => {
    if (!idsPerdidos.has(lr.lead_id)) return;
    contagem[lr.reason] = (contagem[lr.reason] || 0) + 1;
  });
  const total = Object.values(contagem).reduce((s, n) => s + n, 0);
  return Object.entries(contagem)
    .map(([reason, qtd]) => ({ reason, qtd, pct: total ? (qtd / total) * 100 : 0 }))
    .sort((a, b) => b.qtd - a.qtd);
}
