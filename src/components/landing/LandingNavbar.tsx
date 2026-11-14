'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, MapPin } from 'lucide-react';

interface LandingNavbarProps {
  onFocusCep: () => void;
  onOpenPetition: () => void;
}

export const ConnectaLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <svg
      viewBox="0 0 32 32"
      className="h-8 w-8 shrink-0"
      aria-hidden="true"
      fill="none"
    >
      <rect width="32" height="32" rx="9" fill="#18181B" />
      <path d="M10 21.5 16 10l6 11.5H10Z" stroke="#F4F5F7" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="16" cy="10" r="3" fill="#F97316" />
      <circle cx="10" cy="21.5" r="3" fill="#0284C7" />
      <circle cx="22" cy="21.5" r="3" fill="#10B981" />
    </svg>
    <span className="font-display text-lg font-extrabold leading-none tracking-tight text-zinc-900">
      Connecta <span className="text-orange-600">Brasil</span>
    </span>
  </span>
);

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onFocusCep, onOpenPetition }) => {
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Processos Ativos', href: '#processos' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Cidades', href: '#cidades' },
  ];

  const handleCep = () => {
    setOpen(false);
    onFocusCep();
  };

  const handlePetition = () => {
    setOpen(false);
    onOpenPetition();
  };

  return (
    <nav className="border-b border-zinc-200 bg-white/95 backdrop-blur" aria-label="Navegação principal">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Connecta Brasil — início">
          <ConnectaLogo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <a
            href={links[0].href}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-[#F4F5F7] hover:text-zinc-900"
          >
            {links[0].label}
          </a>
          <button
            type="button"
            onClick={handlePetition}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-[#F4F5F7] hover:text-zinc-900"
          >
            Criar Petição
          </button>
          {links.slice(1).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-[#F4F5F7] hover:text-zinc-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCep}
            className="hidden items-center gap-2 rounded-lg border-2 border-zinc-900 bg-white px-4 py-2 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white sm:inline-flex"
          >
            <MapPin className="h-4 w-4" />
            Entrar com meu CEP
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-800 lg:hidden"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-zinc-200 bg-white px-4 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col">
            <a
              href={links[0].href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-zinc-800 hover:bg-[#F4F5F7]"
            >
              {links[0].label}
            </a>
            <button
              type="button"
              onClick={handlePetition}
              className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-zinc-800 hover:bg-[#F4F5F7]"
            >
              Criar Petição
            </button>
            {links.slice(1).map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-zinc-800 hover:bg-[#F4F5F7]"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={handleCep}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-bold text-white"
            >
              <MapPin className="h-4 w-4" />
              Entrar com meu CEP
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
