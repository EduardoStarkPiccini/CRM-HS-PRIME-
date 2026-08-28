'use client';

import { useState } from 'react';

export type TeamMember = {
  id: string;
  full_name: string;
  role: 'vendedor' | 'gestor';
  status: 'ativo' | 'inativo';
  avatar_url: string | null;
  phone: string | null;
};

export default function TeamFormModal({
  member,
  onClose,
  onSaved,
}: {
  member: TeamMember | null; // null = criando novo
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!member;
  const [nome, setNome] = useState(member?.full_name ?? '');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<'vendedor' | 'gestor'>(member?.role ?? 'vendedor');
  const [status, setStatus] = useState<'ativo' | 'inativo'>(member?.status ?? 'ativo');
  const [foto, setFoto] = useState<File | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const fd = new FormData();
    fd.set('nome', nome);
    fd.set('perfil', perfil);
    fd.set('status', status);
    if (foto) fd.set('foto', foto);

    let res: Response;
    if (editing) {
      res = await fetch(`/api/team/${member!.id}`, { method: 'PATCH', body: fd });
    } else {
      fd.set('email', email);
      fd.set('senha', senha);
      res = await fetch('/api/team', { method: 'POST', body: fd });
    }

    const json = await res.json().catch(() => ({}));
    setCarregando(false);

    if (!res.ok) {
      setErro(json.error ?? 'Não foi possível salvar.');
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-gold">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg text-gold">{editing ? 'Editar vendedor' : 'Adicionar vendedor'}</h2>
          <button onClick={onClose} className="text-ink-dim hover:text-ink">✕</button>
        </div>

        {erro && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-ink-dim">Nome completo</label>
            <input required value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>

          {!editing && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wide text-ink-dim">E-mail</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wide text-ink-dim">Senha inicial (mín. 8 caracteres)</label>
                <input type="password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-ink-dim">Foto (opcional)</label>
            <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-ink-dim file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-ink" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wide text-ink-dim">Perfil</label>
              <select value={perfil} onChange={(e) => setPerfil(e.target.value as 'vendedor' | 'gestor')}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold">
                <option value="vendedor">Vendedor</option>
                <option value="gestor">Gestor</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wide text-ink-dim">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={carregando}
            className="w-full rounded-lg bg-gradient-to-r from-gold-dark to-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50">
            {carregando ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar vendedor'}
          </button>
        </form>
      </div>
    </div>
  );
}
