'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const erroInicial = searchParams.get('erro') === 'inativo'
    ? 'Este usuário está inativo. Fale com o gestor responsável.'
    : '';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(erroInicial);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error || !data.user) {
      setErro('E-mail ou senha inválidos.');
      setCarregando(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', data.user.id)
      .single();

    if (!profile || profile.status !== 'ativo') {
      await supabase.auth.signOut();
      setErro('Este usuário está inativo. Fale com o gestor responsável.');
      setCarregando(false);
      return;
    }

    router.push(profile.role === 'gestor' ? '/gestor' : '/vendedor');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {erro}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wide text-ink-dim">E-mail</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wide text-ink-dim">Senha</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
        />
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="w-full rounded-lg bg-gradient-to-r from-gold-dark to-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {carregando ? 'Entrando...' : 'ENTRAR'}
      </button>
    </form>
  );
}
