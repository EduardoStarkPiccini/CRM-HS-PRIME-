'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/database.types';

type Setting = Database['public']['Tables']['commission_settings']['Row'];

export default function CommissionSettingsForm({ initialSettings }: { initialSettings: Setting[] }) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(initialSettings.map((s) => [s.car_origin, String(s.commission_value)]))
  );
  const [salvando, setSalvando] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function salvar(carOrigin: string) {
    setSalvando(carOrigin);
    setMsg('');
    const res = await fetch('/api/commission-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ car_origin: carOrigin, commission_value: Number(valores[carOrigin]) }),
    });
    const json = await res.json().catch(() => ({}));
    setSalvando(null);
    if (!res.ok) { setMsg(json.error ?? 'Não foi possível salvar.'); return; }
    setMsg(`Valor de "${carOrigin}" atualizado. Vendas já registradas mantêm a comissão antiga.`);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-gold">
      <h2 className="mb-1 font-display text-sm tracking-wide text-gold">COMISSÕES</h2>
      <p className="mb-5 text-xs text-ink-dim">
        Valor fixo pago por carro vendido, conforme a origem. Alterar aqui não muda vendas já registradas.
      </p>

      {msg && <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">{msg}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {initialSettings.map((s) => (
          <div key={s.car_origin} className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-dim">{s.car_origin}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-ink-dim">R$</span>
              <input
                type="number" min="0" step="0.01"
                value={valores[s.car_origin]}
                onChange={(e) => setValores((v) => ({ ...v, [s.car_origin]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
            <button
              onClick={() => salvar(s.car_origin)}
              disabled={salvando === s.car_origin}
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-gold-dark to-gold px-3 py-2 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {salvando === s.car_origin ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
