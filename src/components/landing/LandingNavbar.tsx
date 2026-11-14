'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Radio, Menu, X, ArrowRight } from 'lucide-react';

interface LandingNavbarProps {
  onFocusCep: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onFocusCep }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCtaClick = () => {
    setMobileMenuOpen(false);
    onFocusCep();
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#09090B]/80 backdrop-blur-xl border-b border-zinc-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo tipográfico com ícone minimalista de radar/pulso */}
        <Link href="/" className="flex items-center space-x-2.5 group select-none">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
            <Radio className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-white">
            Con<span className="text-emerald-400">necta</span>
          </span>
        </Link>

        {/* Links rápidos Desktop */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
          <a href="#como-funciona" className="hover:text-white transition-colors">
            Como Funciona
          </a>
          <a href="#seguranca" className="hover:text-white transition-colors">
            Por que é Seguro
          </a>
          <a href="#cidades" className="hover:text-white transition-colors">
            Cidades
          </a>
          <Link href="/feed" className="hover:text-emerald-400 transition-colors">
            Explorar Feed
          </Link>
        </nav>

        {/* CTA Principal + Menu Mobile */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleCtaClick}
            className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95"
          >
            <span>Verificar meu CEP</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menu"
            className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#09090B]/95 backdrop-blur-xl border-b border-zinc-800 px-4 py-4 space-y-3">
          <a
            href="#como-funciona"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-zinc-300 hover:text-white"
          >
            Como Funciona
          </a>
          <a
            href="#seguranca"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-zinc-300 hover:text-white"
          >
            Por que é Seguro
          </a>
          <a
            href="#cidades"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-zinc-300 hover:text-white"
          >
            Cidades
          </a>
          <Link
            href="/feed"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Explorar Feed Ao Vivo
          </Link>
          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm"
          >
            <span>Verificar meu CEP</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};

