'use client';

import { useMemo, useState } from 'react';
import { ORIGENS, STAGES } from '@/lib/leads/constants';
import { currentMonthKey, monthKey, monthLabel, todayStr } from '@/lib/leads/utils';
import type { Lead, Vendedor } from '@/lib/leads/types';
import LeadCard from '@/components/leads/lead-card';
import NextActionsPanel from '@/components/leads/next-actions-panel';
import LeadFormModal from '@/components/leads/lead-form-modal';

type Profile = { id: string; full_name: string; role: 'gestor' | 'vendedor' };

export default function LeadsBoard({
  profile,
  initialLeads,
  vendedores,
}: {
  profile: Profile;
  initialLeads: Lead[];
  vendedores: Vendedor[];
}) {
  const isGestor = profile.role === 'gestor';
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [periodo, setPeriodo] = useState<string>(currentMonthKey());
  const [filtroVendedor, setFiltroVendedor] = useState<string>('todos');
  const [filtros, setFiltros] = useState({ etapa: 'todas', origem: 'todas', busca: '' });
  const [modal, setModal] = useState<'new' | Lead | null>(null);
  const [toast, setToast] = useState('');

  const vendedoresPorId = useMemo(
    () => Object.fromEntries(vendedores.map((v) => [v.id, v])),
    [vendedores]
  );

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  function upsertLead(lead: Lead) {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === lead.id);
      return exists ? prev.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...prev];
    });
  }

  async function quickStage(lead: Lead, novaEtapa: string) {
    if (novaEtapa === 'perdido') {
      // etapa "perdido" exige motivo — abre o modal para escolher em vez de trocar direto
      setModal(lead);
      return;
    }
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: novaEtapa }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { notify(json.error ?? 'Não foi possível mover o lead.'); return; }
    upsertLead(json.lead);
    notify('Etapa atualizada.');
  }

  // ---------- escopo (vendedor filtrado, se gestor escolheu um) ----------
  const escopo = useMemo(() => {
    if (!isGestor || filtroVendedor === 'todos') return leads;
    return leads.filter((l) => l.assigned_to === filtroVendedor);
  }, [leads, isGestor, filtroVendedor]);

  const anosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => { if (l.entry_date) set.add(l.entry_date.slice(0, 4)); });
    set.add(todayStr().slice(0, 4));
    return Array.from(set).sort();
  }, [leads]);

  const escopoPeriodo = useMemo(() => {
    if (periodo === 'todos') return escopo;
    return escopo.filter((l) => monthKey(l.entry_date) === periodo);
  }, [escopo, periodo]);

  const filtrados = useMemo(() => {
    return escopoPeriodo.filter((l) => {
      if (filtros.etapa !== 'todas' && l.stage !== filtros.etapa) return false;
      if (filtros.origem !== 'todas' && l.origin !== filtros.origem) return false;
      if (filtros.busca) {
        const q = filtros.busca.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !(l.whatsapp ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [escopoPeriodo, filtros]);

  const semProximaAcao = useMemo(() => {
    return escopo.filter((l) => (l.stage === 'lead' || l.stage === 'qualificado') && !l.next_action_date).length;
  }, [escopo]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { lead: 0, qualificado: 0, vendido: 0, perdido: 0 };
    filtrados.forEach((l) => { c[l.stage] = (c[l.stage] ?? 0) + 1; });
    return c;
  }, [filtrados]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Leads</h1>
        <p className="mt-1 text-sm text-ink-dim">
          {isGestor ? 'Você vê os leads de toda a equipe.' : 'Você vê somente os seus leads.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink outline-none">
            <option value="todos">TODOS OS MESES</option>
            {anosDisponiveis.map((ano) => (
              <optgroup key={ano} label={ano}>
                {Array.from({ length: 12 }, (_, i) => {
                  const mm = String(i + 1).padStart(2, '0');
                  const key = `${ano}-${mm}`;
                  return <option key={key} value={key}>{monthLabel(key)}</option>;
                })}
              </optgroup>
            ))}
          </select>

          {isGestor && (
            <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink outline-none">
              <option value="todos">TODOS OS VENDEDORES</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.full_name}</option>)}
            </select>
          )}
        </div>

        <button onClick={() => setModal('new')}
          className="rounded-lg bg-gradient-to-r from-gold-dark to-gold px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90">
          + Novo Lead
        </button>
      </div>

      {semProximaAcao > 0 && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300">
          ⚠️ {isGestor && filtroVendedor === 'todos' ? 'A equipe possui' : 'Você possui'} {semProximaAcao} lead{semProximaAcao === 1 ? '' : 's'} sem próxima ação.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((s) => (
          <div key={s.key} className="rounded-lg border border-border bg-surface p-3" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="font-mono text-xl font-semibold text-ink">{counts[s.key] ?? 0}</div>
            <div className="text-[10px] uppercase tracking-wide text-ink-dim">{s.label}</div>
          </div>
        ))}
      </div>

      <NextActionsPanel
        leads={escopo}
        vendedoresPorId={vendedoresPorId}
        showVendedor={isGestor}
        titulo={isGestor && filtroVendedor === 'todos' ? 'Próximas ações da equipe' : 'Minhas próximas ações'}
        onOpen={(id) => setModal(leads.find((l) => l.id === id) ?? null)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <select value={filtros.etapa} onChange={(e) => setFiltros((f) => ({ ...f, etapa: e.target.value }))}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-ink outline-none">
          <option value="todas">Todas as etapas</option>
          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={filtros.origem} onChange={(e) => setFiltros((f) => ({ ...f, origem: e.target.value }))}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-ink outline-none">
          <option value="todas">Todas as origens</option>
          {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <input
          placeholder="Buscar nome ou WhatsApp"
          value={filtros.busca}
          onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-ink outline-none focus:border-gold"
        />
        {(filtros.etapa !== 'todas' || filtros.origem !== 'todas' || filtros.busca) && (
          <button onClick={() => setFiltros({ etapa: 'todas', origem: 'todas', busca: '' })} className="text-xs text-ink-dim underline">
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((s) => {
          const itens = filtrados.filter((l) => l.stage === s.key);
          return (
            <div key={s.key} className="rounded-xl border border-border bg-black/20">
              <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `2px solid ${s.color}` }}>
                <span className="text-xs font-semibold tracking-wide text-ink">{s.label}</span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-ink-dim">{itens.length}</span>
              </div>
              <div className="flex flex-col gap-2 p-2.5 min-h-[80px]">
                {itens.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-[11px] text-ink-dim">
                    Sem leads aqui
                  </div>
                )}
                {itens.map((l) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    vendedorNome={vendedoresPorId[l.assigned_to ?? '']?.full_name}
                    showVendedor={isGestor}
                    onOpen={() => setModal(l)}
                    onQuickStage={(novaEtapa) => quickStage(l, novaEtapa)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <LeadFormModal
          lead={modal === 'new' ? null : modal}
          isGestor={isGestor}
          currentUserId={profile.id}
          vendedores={vendedores}
          onClose={() => setModal(null)}
          onSaved={(lead) => { upsertLead(lead); setModal(null); }}
          notify={notify}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-black shadow-gold">
          {toast}
        </div>
      )}
    </div>
  );
}
