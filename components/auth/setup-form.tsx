'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupForm() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const res = await fetch('/api/setup/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, codigo }),
    });
    const json = await res.json();
    setCarregando(false);

    if (!res.ok) {
      setErro(json.error ?? 'Não foi possível criar o gestor.');
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push('/login'), 1800);
  }

  if (sucesso) {
    return (
      <div className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
        Gestor principal criado com sucesso. Redirecionando para o login…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {erro}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wide text-ink-dim">Nome completo</label>
        <input required value={nome} onChange={(e) => setNome(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wide text-ink-dim">E-mail</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wide text-ink-dim">Senha (mín. 8 caracteres)</label>
        <input type="password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wide text-ink-dim">Código de configuração</label>
        <input required value={codigo} onChange={(e) => setCodigo(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold" />
        <p className="text-xs text-ink-dim">O mesmo valor definido em SETUP_ADMIN_SECRET nas variáveis de ambiente.</p>
      </div>

      <button type="submit" disabled={carregando}
        className="w-full rounded-lg bg-gradient-to-r from-gold-dark to-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50">
        {carregando ? 'Criando...' : 'CRIAR GESTOR PRINCIPAL'}
      </button>
    </form>
  );
}
