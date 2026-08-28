'use client';

import { useMemo, useState } from 'react';
import { getAlerta } from '@/lib/leads/utils';
import type { Lead, Vendedor } from '@/lib/leads/types';

const TABS: { key: string; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'atrasadas', label: 'Atrasadas' },
  { key: 'hoje', label: 'Hoje' },
  { key: 'amanha', label: 'Amanhã' },
  { key: 'proximos', label: 'Próximos dias' },
];

const NIVEL_POR_ABA: Record<string, string> = {
  atrasadas: 'atrasado', hoje: 'hoje', amanha: 'amanha', proximos: 'futuro',
};

export default function NextActionsPanel({
  leads,
  vendedoresPorId,
  showVendedor,
  titulo,
  onOpen,
}: {
  leads: Lead[];
  vendedoresPorId: Record<string, Vendedor>;
  showVendedor: boolean;
  titulo: string;
  onOpen: (id: string) => void;
}) {
  const [aba, setAba] = useState('todas');

  const itens = useMemo(() => {
    const comAlerta = leads
      .map((l) => ({ lead: l, alerta: getAlerta(l.stage, l.next_action_date) }))
      .filter((x): x is { lead: Lead; alerta: NonNullable<ReturnType<typeof getAlerta>> } => !!x.alerta);

    const filtrado = aba === 'todas' ? comAlerta : comAlerta.filter((x) => x.alerta.level === NIVEL_POR_ABA[aba]);

    const ordem: Record<string, number> = { atrasado: 0, hoje: 1, amanha: 2, futuro: 3 };
    return filtrado.sort((a, b) => ordem[a.alerta.level] - ordem[b.alerta.level] || a.alerta.date.localeCompare(b.alerta.date));
  }, [leads, aba]);

  const badgeClasses: Record<string, string> = {
    atrasado: 'bg-red-500/15 text-red-400',
    hoje: 'bg-amber-400/15 text-amber-300',
    amanha: 'bg-violet-400/15 text-violet-300',
    futuro: 'bg-blue-400/15 text-blue-300',
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-3 font-display text-sm tracking-wide text-gold">{titulo}</h2>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setAba(t.key)}
            className={`rounded-full border px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wide transition ${
              aba === t.key ? 'border-gold bg-gold text-black' : 'border-border text-ink-dim hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {itens.length === 0 ? (
        <p className="py-2 text-sm text-ink-dim">Nenhuma ação por aqui. 🎉</p>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {itens.slice(0, 30).map(({ lead, alerta }) => (
            <button
              key={lead.id}
              onClick={() => onOpen(lead.id)}
              className="min-w-[190px] flex-none rounded-lg border border-border bg-surface-2 p-3 text-left transition hover:border-gold/30"
            >
              <div className="text-[13px] font-semibold text-ink">{lead.name}</div>
              {showVendedor && (
                <div className="text-[10px] text-ink-dim">{vendedoresPorId[lead.assigned_to ?? '']?.full_name ?? '—'}</div>
              )}
              <div className="mt-1 text-xs text-ink-dim">{lead.next_action || 'Sem descrição'}</div>
              <span className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-mono ${badgeClasses[alerta.level]}`}>
                {alerta.text}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
