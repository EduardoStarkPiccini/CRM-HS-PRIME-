'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TeamFormModal, { type TeamMember } from '@/components/team/team-form-modal';

export default function TeamList({ initialProfiles }: { initialProfiles: TeamMember[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<'create' | TeamMember | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  function closeAndRefresh(criando: boolean) {
    setModal(null);
    notify(criando ? 'Vendedor criado com sucesso.' : 'Alterações salvas com sucesso.');
    router.refresh();
  }

  async function toggleStatus(member: TeamMember) {
    setBusyId(member.id);
    const novoStatus = member.status === 'ativo' ? 'inativo' : 'ativo';
    const fd = new FormData();
    fd.set('status', novoStatus);
    const res = await fetch(`/api/team/${member.id}`, { method: 'PATCH', body: fd });
    setBusyId(null);
    if (res.ok) {
      notify(novoStatus === 'ativo' ? 'Vendedor ativado.' : 'Vendedor desativado. O login dele foi bloqueado.');
    } else {
      notify('Não foi possível atualizar o status.');
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-gold">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm tracking-wide text-gold">EQUIPE</h2>
        <button
          onClick={() => setModal('create')}
          className="rounded-lg bg-gradient-to-r from-gold-dark to-gold px-4 py-2 text-xs font-semibold text-black transition hover:opacity-90"
        >
          + Adicionar vendedor
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-dim">
              <th className="px-3 py-2">Foto</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Perfil</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {initialProfiles.map((m) => (
              <tr key={m.id} className="border-b border-border">
                <td className="px-3 py-3">
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar_url} alt={m.full_name} className="h-9 w-9 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2 text-xs text-ink-dim">
                      {m.full_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-ink">{m.full_name}</td>
                <td className="px-3 py-3 text-ink-dim">{m.role === 'gestor' ? 'Gestor' : 'Vendedor'}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${
                    m.status === 'ativo' ? 'bg-gold/10 text-gold' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <button onClick={() => setModal(m)} className="mr-2 rounded-lg border border-border px-3 py-1.5 text-xs text-ink-dim hover:text-ink">
                    Editar
                  </button>
                  <button
                    onClick={() => toggleStatus(m)}
                    disabled={busyId === m.id}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink-dim hover:text-ink disabled:opacity-50"
                  >
                    {m.status === 'ativo' ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
            {initialProfiles.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-ink-dim">Nenhum usuário cadastrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <TeamFormModal
          member={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => closeAndRefresh(modal === 'create')}
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
