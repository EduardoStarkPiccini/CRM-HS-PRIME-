'use client';

import { useEffect, useState } from 'react';
import { MOTIVOS_PERDA, ORIGENS, STAGES, STAGE_KEYS, STAGE_LABEL } from '@/lib/leads/constants';
import { ORIGENS_CARRO } from '@/lib/sales/constants';
import { fmtDateShort, todayStr } from '@/lib/leads/utils';
import type { HistoryEntry, Lead, Vendedor } from '@/lib/leads/types';

type Props = {
  lead: Lead | null; // null = criando novo
  isGestor: boolean;
  currentUserId: string;
  vendedores: Vendedor[];
  onClose: () => void;
  onSaved: (lead: Lead) => void;
  notify: (msg: string) => void;
};

/** fetch + parse do JSON, mas nunca deixa uma queda de rede travar o botão sem aviso. */
async function callApi(url: string, options?: RequestInit): Promise<{ ok: boolean; json: any }> {
  try {
    const res = await fetch(url, options);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json };
  } catch {
    return { ok: false, json: { error: 'Falha de conexão. Verifique sua internet e tente novamente.' } };
  }
}

export default function LeadFormModal({ lead, isGestor, currentUserId, vendedores, onClose, onSaved, notify }: Props) {
  const editing = !!lead;
  const [tab, setTab] = useState<'dados' | 'historico'>('dados');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [pendingStage, setPendingStage] = useState<string | null>(null);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [saleForm, setSaleForm] = useState({
    sale_date: todayStr(),
    vehicle: lead?.car_interest ?? '',
    sale_value: '',
    origin: 'HS PRIME',
    notes: '',
  });

  const [form, setForm] = useState({
    name: lead?.name ?? '',
    whatsapp: lead?.whatsapp ?? '',
    car_interest: lead?.car_interest ?? '',
    origin: lead?.origin ?? 'Instagram',
    assigned_to: lead?.assigned_to ?? currentUserId,
    stage: lead?.stage ?? 'lead',
    next_action: lead?.next_action ?? '',
    next_action_date: lead?.next_action_date ?? '',
    notes: lead?.notes ?? '',
    entry_date: lead?.entry_date ?? todayStr(),
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [novaAnotacao, setNovaAnotacao] = useState('');
  const [loadingHist, setLoadingHist] = useState(false);

  useEffect(() => {
    if (editing && tab === 'historico') {
      setLoadingHist(true);
      fetch(`/api/leads/${lead!.id}/history`)
        .then((r) => r.json())
        .then((j) => setHistory(j.history ?? []))
        .finally(() => setLoadingHist(false));
    }
  }, [tab, editing, lead]);

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSalvarDados(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.name.trim()) { setErro('Informe o nome do cliente.'); return; }
    setSalvando(true);

    const url = editing ? `/api/leads/${lead!.id}` : '/api/leads';
    const method = editing ? 'PATCH' : 'POST';
    const { ok, json } = await callApi(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSalvando(false);

    if (!ok) { setErro(json.error ?? 'Não foi possível salvar.'); return; }
    notify(editing ? 'Alterações salvas.' : 'Lead cadastrado com sucesso.');
    onSaved(json.lead);
  }

  async function aplicarEtapa(novaEtapa: string) {
    if (!editing) { setField('stage', novaEtapa as Lead['stage']); return; }
    if (novaEtapa === lead!.stage) return;

    if (novaEtapa === 'perdido') {
      setPendingStage(novaEtapa);
      return;
    }
    if (novaEtapa === 'vendido') {
      setSaleForm((f) => ({ ...f, vehicle: f.vehicle || lead!.car_interest || '' }));
      setPendingStage(novaEtapa);
      return;
    }

    setSalvando(true);
    const { ok, json } = await callApi(`/api/leads/${lead!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: novaEtapa }),
    });
    setSalvando(false);
    if (!ok) { notify(json.error ?? 'Não foi possível mudar a etapa.'); return; }
    setField('stage', novaEtapa as Lead['stage']);
    notify('Etapa atualizada.');
    onSaved(json.lead);
  }

  async function confirmarVenda() {
    setErro('');
    if (!saleForm.vehicle.trim()) { setErro('Informe o veículo vendido.'); return; }
    if (!saleForm.sale_value || Number(saleForm.sale_value) <= 0) { setErro('Informe um valor de venda válido.'); return; }

    setSalvando(true);
    const { ok, json } = await callApi(`/api/leads/${lead!.id}/sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleForm),
    });
    setSalvando(false);
    if (!ok) { setErro(json.error ?? 'Não foi possível registrar a venda.'); return; }
    setField('stage', 'vendido');
    setPendingStage(null);
    notify(`Venda registrada com sucesso — comissão de R$ ${Number(json.sale.commission_value).toFixed(2)}.`);
    onSaved(json.lead);
  }

  async function confirmarPerda() {
    if (!motivoPerda) { setErro('Selecione o motivo da perda.'); return; }
    setSalvando(true);
    const { ok, json } = await callApi(`/api/leads/${lead!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'perdido', motivoPerda }),
    });
    setSalvando(false);
    if (!ok) { setErro(json.error ?? 'Não foi possível registrar a perda.'); return; }
    setField('stage', 'perdido');
    setPendingStage(null);
    notify('Lead marcado como perdido.');
    onSaved(json.lead);
  }

  async function adicionarHistorico() {
    if (!novaAnotacao.trim()) return;
    setLoadingHist(true);
    const { ok, json } = await callApi(`/api/leads/${lead!.id}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: novaAnotacao }),
    });
    if (ok) {
      setNovaAnotacao('');
      const r = await callApi(`/api/leads/${lead!.id}/history`);
      setHistory(r.json.history ?? []);
      notify('Histórico atualizado.');
    } else {
      notify(json.error ?? 'Não foi possível adicionar ao histórico.');
    }
    setLoadingHist(false);
  }

  const vendedorOptions = isGestor ? vendedores : vendedores.filter((v) => v.id === currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-border bg-surface shadow-gold sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-5 py-4">
          <h2 className="font-display text-base text-ink">{editing ? lead!.name : 'Novo lead'}</h2>
          <button onClick={onClose} className="text-ink-dim hover:text-ink">✕</button>
        </div>

        <div className="px-5 pt-4">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {STAGES.map((s) => {
              const bloqueadoNaCriacao = !editing && (s.key === 'vendido' || s.key === 'perdido');
              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={salvando || bloqueadoNaCriacao}
                  title={bloqueadoNaCriacao ? 'Cadastre o lead primeiro; venda/perda são registradas depois' : undefined}
                  onClick={() => aplicarEtapa(s.key)}
                  className="rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition disabled:opacity-40"
                  style={
                    form.stage === s.key
                      ? { background: s.color, borderColor: s.color, color: '#0c1220' }
                      : { borderColor: '#333a42', color: '#9aa3ad' }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {pendingStage === 'perdido' && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <label className="mb-1.5 block text-xs font-semibold text-red-300">Motivo da perda</label>
              <select
                value={motivoPerda}
                onChange={(e) => setMotivoPerda(e.target.value)}
                className="mb-2 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none"
              >
                <option value="">Selecione...</option>
                {MOTIVOS_PERDA.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={confirmarPerda} disabled={salvando} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  Confirmar perda
                </button>
                <button onClick={() => { setPendingStage(null); setMotivoPerda(''); }} className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink-dim">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {pendingStage === 'vendido' && (
            <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 p-3">
              <p className="mb-2 text-xs font-semibold text-gold">Registrar venda</p>
              {erro && <div className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{erro}</div>}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10.5px] uppercase tracking-wide text-ink-dim">Data da venda</label>
                  <input type="date" value={saleForm.sale_date} onChange={(e) => setSaleForm((f) => ({ ...f, sale_date: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10.5px] uppercase tracking-wide text-ink-dim">Origem do carro</label>
                  <select value={saleForm.origin} onChange={(e) => setSaleForm((f) => ({ ...f, origin: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none">
                    {ORIGENS_CARRO.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10.5px] uppercase tracking-wide text-ink-dim">Veículo</label>
                  <input value={saleForm.vehicle} onChange={(e) => setSaleForm((f) => ({ ...f, vehicle: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10.5px] uppercase tracking-wide text-ink-dim">Valor da venda (R$)</label>
                  <input type="number" min="0" step="0.01" value={saleForm.sale_value} onChange={(e) => setSaleForm((f) => ({ ...f, sale_value: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10.5px] uppercase tracking-wide text-ink-dim">Comissão</label>
                  <input disabled value="Calculada automaticamente ao confirmar"
                    className="w-full cursor-not-allowed rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-ink-dim outline-none" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10.5px] uppercase tracking-wide text-ink-dim">Observações</label>
                  <textarea value={saleForm.notes} onChange={(e) => setSaleForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={confirmarVenda} disabled={salvando} className="rounded-lg bg-gradient-to-r from-gold-dark to-gold px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50">
                  {salvando ? 'Registrando...' : 'Confirmar venda'}
                </button>
                <button onClick={() => setPendingStage(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink-dim">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {editing && (
            <div className="mb-3 flex gap-4 border-b border-border text-xs font-semibold uppercase tracking-wide">
              <button onClick={() => setTab('dados')} className={`pb-2 ${tab === 'dados' ? 'border-b-2 border-gold text-ink' : 'text-ink-dim'}`}>Dados</button>
              <button onClick={() => setTab('historico')} className={`pb-2 ${tab === 'historico' ? 'border-b-2 border-gold text-ink' : 'text-ink-dim'}`}>Histórico</button>
            </div>
          )}
        </div>

        <div className="px-5 pb-6">
          {(!editing || tab === 'dados') && (
            <form onSubmit={handleSalvarDados} className="space-y-3">
              {erro && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{erro}</div>}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nome" value={form.name} onChange={(v) => setField('name', v)} required />
                <Field label="WhatsApp" value={form.whatsapp ?? ''} onChange={(v) => setField('whatsapp', v)} />
                <Field label="Carro de interesse" value={form.car_interest ?? ''} onChange={(v) => setField('car_interest', v)} />
                <SelectField label="Origem do lead" value={form.origin ?? ''} onChange={(v) => setField('origin', v)} options={[...ORIGENS]} />
                <SelectField
                  label="Vendedor responsável"
                  value={form.assigned_to ?? ''}
                  onChange={(v) => setField('assigned_to', v)}
                  options={vendedorOptions.map((v) => v.id)}
                  labels={Object.fromEntries(vendedorOptions.map((v) => [v.id, v.full_name]))}
                  disabled={!isGestor}
                />
                <Field type="date" label="Data de entrada" value={form.entry_date ?? ''} onChange={(v) => setField('entry_date', v)} />
                <Field type="date" label="Data da próxima ação" value={form.next_action_date ?? ''} onChange={(v) => setField('next_action_date', v)} />
                <Field label="Próxima ação" value={form.next_action ?? ''} onChange={(v) => setField('next_action', v)} className="sm:col-span-2" />
                <TextAreaField label="Observações" value={form.notes ?? ''} onChange={(v) => setField('notes', v)} className="sm:col-span-2" />
              </div>

              <button type="submit" disabled={salvando}
                className="mt-2 w-full rounded-lg bg-gradient-to-r from-gold-dark to-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50">
                {salvando ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar lead'}
              </button>
            </form>
          )}

          {editing && tab === 'historico' && (
            <div>
              <div className="mb-3 flex gap-2">
                <input
                  value={novaAnotacao}
                  onChange={(e) => setNovaAnotacao(e.target.value)}
                  placeholder="Adicionar ao histórico..."
                  className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold"
                />
                <button onClick={adicionarHistorico} disabled={loadingHist}
                  className="rounded-lg bg-gradient-to-r from-gold-dark to-gold px-4 py-2 text-xs font-semibold text-black disabled:opacity-50">
                  Adicionar
                </button>
              </div>

              {loadingHist ? (
                <p className="text-sm text-ink-dim">Carregando...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-ink-dim">Sem registros ainda.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {history.map((h) => (
                    <div key={h.id} className="flex gap-3 text-sm">
                      <span className="whitespace-nowrap font-mono text-xs text-ink-dim">{fmtDateShort(h.event_date)}</span>
                      <span className="text-ink">{h.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[11px] uppercase tracking-wide text-ink-dim">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
    </div>
  );
}

function TextAreaField({ label, value, onChange, className = '' }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[11px] uppercase tracking-wide text-ink-dim">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, labels, disabled }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string>; disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] uppercase tracking-wide text-ink-dim">{label}</label>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold disabled:opacity-60">
        {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
      </select>
    </div>
  );
}
