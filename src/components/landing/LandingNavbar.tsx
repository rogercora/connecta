'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, MapPin, Sparkles, HeartHandshake } from 'lucide-react';

interface LandingNavbarProps {
  onFocusCep: () => void;
  onOpenPetition: () => void;
}

export const ConnectaLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 text-white shadow-sm shadow-terracotta-500/20">
      <HeartHandshake className="h-5 w-5" />
    </span>
    <span className="font-display text-xl font-extrabold tracking-tight text-earth-900">
      Connecta <span className="text-terracotta-500">Brasil</span>
    </span>
  </span>
);

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onFocusCep, onOpenPetition }) => {
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Causas Ativas', href: '#processos' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Cidades em Expansão', href: '#cidades' },
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
    <nav className="border-b border-[#EAE3D6] bg-[#FAF7F2]/90 backdrop-blur-md" aria-label="Navegação principal">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <Link href="/" aria-label="Connecta Brasil — início" className="transition-opacity hover:opacity-90">
          <ConnectaLogo />
        </Link>

        {/* Links centrais estilo HopeRise com pílulas suaves */}
        <div className="hidden items-center gap-1.5 rounded-full border border-[#E7DFD2] bg-white/70 px-3 py-1.5 shadow-xs lg:flex">
          <a
            href={links[0].href}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-earth-700 transition-colors hover:bg-cream-200 hover:text-earth-900"
          >
            {links[0].label}
          </a>
          <button
            type="button"
            onClick={handlePetition}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-terracotta-600 transition-colors hover:bg-terracotta-50 hover:text-terracotta-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Criar Abaixo-Assinado
          </button>
          {links.slice(1).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-earth-700 transition-colors hover:bg-cream-200 hover:text-earth-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Botão de ação à direita estilo HopeRise Charity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCep}
            className="hidden items-center gap-2 rounded-full bg-terracotta-500 px-5 py-2.5 text-sm font-bold text-white shadow-hoperise-btn transition-all hover:bg-terracotta-600 hover:shadow-md active:scale-[0.98] sm:inline-flex"
          >
            <MapPin className="h-4 w-4" />
            Verificar meu CEP
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E7DFD2] bg-white text-earth-800 transition-colors hover:bg-cream-200 lg:hidden"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 text-earth-700" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="border-t border-[#EAE3D6] bg-[#FAF7F2] px-4 pb-5 pt-3 lg:hidden">
          <div className="flex flex-col gap-1.5">
            <a
              href={links[0].href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-earth-800 hover:bg-cream-200"
            >
              {links[0].label}
            </a>
            <button
              type="button"
              onClick={handlePetition}
              className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-terracotta-600 hover:bg-terracotta-50"
            >
              ✍️ Criar Abaixo-Assinado
            </button>
            {links.slice(1).map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-earth-800 hover:bg-cream-200"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={handleCep}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-terracotta-500 px-5 py-3.5 text-sm font-bold text-white shadow-hoperise-btn hover:bg-terracotta-600"
            >
              <MapPin className="h-4 w-4" />
              Verificar meu CEP
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
