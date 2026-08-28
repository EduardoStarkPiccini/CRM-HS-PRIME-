'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/auth/logout-button';

export default function DashboardHeader({
  nome,
  perfil,
  links,
}: {
  nome: string;
  perfil: 'gestor' | 'vendedor';
  links: { href: string; label: string }[];
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/40 bg-gradient-to-br from-gold-dark to-gold font-display text-xs font-bold text-black">
            HS
          </div>
          <div>
            <p className="font-display text-sm tracking-wide text-ink">CRM HS PRIME</p>
            <p className="text-[11px] text-ink-dim">{perfil === 'gestor' ? 'Painel do gestor' : 'Painel do vendedor'}</p>
          </div>
        </div>

        {/* Navegação — visível a partir de sm (tablet/desktop) */}
        <nav className="hidden items-center gap-5 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-xs font-semibold uppercase tracking-wide transition hover:text-gold ${
                pathname === l.href ? 'text-gold' : 'text-ink-dim'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-sm text-ink-dim">{nome}</span>
          <LogoutButton />
        </div>

        {/* Botão hambúrguer — só no celular */}
        <button
          onClick={() => setMenuAberto((v) => !v)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink sm:hidden"
        >
          {menuAberto ? '✕' : '☰'}
        </button>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="border-t border-border bg-surface px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuAberto(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  pathname === l.href ? 'bg-gold/10 text-gold' : 'text-ink-dim'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex items-center justify-between border-t border-border px-3 pt-3">
            <span className="text-sm text-ink-dim">{nome}</span>
            <LogoutButton />
          </div>
        </div>
      )}
    </header>
  );
}
