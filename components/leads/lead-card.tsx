'use client';

import { STAGES, STAGE_KEYS, STAGE_LABEL } from '@/lib/leads/constants';
import { getAlerta, stageColor } from '@/lib/leads/utils';
import type { Lead } from '@/lib/leads/types';

export default function LeadCard({
  lead,
  vendedorNome,
  showVendedor,
  onOpen,
  onQuickStage,
}: {
  lead: Lead;
  vendedorNome?: string;
  showVendedor: boolean;
  onOpen: () => void;
  onQuickStage: (novaEtapa: string) => void;
}) {
  const alerta = getAlerta(lead.stage, lead.next_action_date);
  const idx = STAGE_KEYS.indexOf(lead.stage);
  const gaugeMax = lead.stage === 'perdido' ? STAGES.length : idx + 1;
  const cor = stageColor(lead.stage);

  const badgeClasses: Record<string, string> = {
    atrasado: 'bg-red-500/15 text-red-400',
    hoje: 'bg-amber-400/15 text-amber-300',
    amanha: 'bg-violet-400/15 text-violet-300',
    futuro: 'bg-blue-400/15 text-blue-300',
  };

  return (
    <div
      className="group relative cursor-pointer rounded-lg border border-border bg-surface p-3 pl-3.5 transition hover:border-gold/30"
      style={{ borderLeft: `3px solid ${cor}` }}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="pr-2 text-[13.5px] font-semibold text-ink">{lead.name}</span>
        <span className="whitespace-nowrap rounded bg-surface-2 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-ink-dim">
          {lead.origin || 'Outro'}
        </span>
      </div>

      {showVendedor && vendedorNome && (
        <div className="mt-0.5 text-[10.5px] text-gold/80">{vendedorNome}</div>
      )}

      <div className="mt-1 text-xs text-ink-dim">{lead.car_interest || 'Carro não informado'}</div>

      <div className="mt-2 flex items-center justify-between text-[10.5px] text-ink-dim">
        <span>{lead.whatsapp || '—'}</span>
        {alerta && (
          <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold ${badgeClasses[alerta.level]}`}>
            {alerta.text}
          </span>
        )}
      </div>

      <div className="mt-2 flex gap-1">
        {STAGES.map((s, i) => (
          <span
            key={s.key}
            className="h-[3px] flex-1 rounded"
            style={{ background: i < gaugeMax ? cor : '#333a42' }}
          />
        ))}
      </div>

      <div className="mt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
        <select
          value={lead.stage}
          onChange={(e) => onQuickStage(e.target.value)}
          className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-dim outline-none"
          title="Mover etapa rapidamente"
        >
          {STAGE_KEYS.map((k) => (
            <option key={k} value={k}>{STAGE_LABEL[k]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
