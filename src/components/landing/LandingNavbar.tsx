'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, MapPin, Sparkles, Megaphone, LogIn } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface LandingNavbarProps {
  onFocusCep: () => void;
  onOpenPetition: () => void;
}

export const ConectaBrLogo: React.FC<{ className?: string; inverted?: boolean }> = ({
  className = '',
  inverted = false,
}) => (
  <span className={`inline-flex items-center gap-3 ${className}`}>
    <span
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-xs transition-transform hover:scale-105 ${
        inverted
          ? 'bg-zinc-900 border border-zinc-800'
          : 'bg-white border border-zinc-200 shadow-xs'
      }`}
    >
      <svg viewBox="0 0 40 40" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Corpo do Megafone Cívico */}
        <path
          d="M 12 16 L 22 12 L 22 28 L 12 24 Z"
          fill="#E11D48"
          stroke="#BE123C"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect x="8" y="17" width="5" height="6" rx="1.5" fill={inverted ? '#FFFFFF' : '#18181B'} />
        <path
          d="M 14 24 L 16 30 L 19 30 L 17 24"
          stroke={inverted ? '#FFFFFF' : '#18181B'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Ondas sonoras de pressão popular */}
        <path d="M 26 14 A 9 9 0 0 1 26 26" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 30 11 A 14 14 0 0 1 30 29" stroke="#FB7185" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
    <span className="flex flex-col">
      <span
        className={`font-display text-xl font-extrabold tracking-tight leading-none ${
          inverted ? 'text-white' : 'text-zinc-950'
        }`}
      >
        Conecta<span className="text-crimson-600">Br</span>
      </span>
      <span
        className={`text-[9.5px] font-bold uppercase tracking-wider leading-tight mt-1 ${
          inverted ? 'text-zinc-400' : 'text-zinc-500'
        }`}
      >
        Democracia Direta
      </span>
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
    <nav className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-md" aria-label="Navegação principal">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <Link href="/" aria-label="ConectaBr — Início" className="transition-opacity hover:opacity-90">
          <ConectaBrLogo />
        </Link>

        {/* Links centrais com pílulas suaves */}
        <div className="hidden items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-1.5 shadow-xs lg:flex">
          <a
            href={links[0].href}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-200/70 hover:text-zinc-950"
          >
            {links[0].label}
          </a>
          <button
            type="button"
            onClick={handlePetition}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold text-crimson-600 transition-colors hover:bg-crimson-50 hover:text-crimson-700 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Criar Abaixo-Assinado
          </button>
          {links.slice(1).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-200/70 hover:text-zinc-950"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Botão de ação à direita */}
        <div className="flex items-center gap-2.5">
          <LandingAuthLink />
          <button
            type="button"
            onClick={handleCep}
            className="hidden items-center gap-2 rounded-full bg-crimson-600 px-5 py-2.5 text-sm font-bold text-white shadow-crimson-btn transition-all hover:bg-crimson-700 hover:shadow-md active:scale-[0.98] sm:inline-flex cursor-pointer"
          >
            <MapPin className="h-4 w-4" />
            Verificar meu CEP
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 transition-colors hover:bg-zinc-100 lg:hidden cursor-pointer"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 text-zinc-800" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="border-t border-zinc-200 bg-white px-4 pb-5 pt-3 lg:hidden">
          <div className="flex flex-col gap-1.5">
            <a
              href={links[0].href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              {links[0].label}
            </a>
            <button
              type="button"
              onClick={handlePetition}
              className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-crimson-600 hover:bg-crimson-50 cursor-pointer"
            >
              📢 Criar Abaixo-Assinado
            </button>
            {links.slice(1).map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <LandingAuthLink mobile />
              <button
                type="button"
                onClick={handleCep}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-crimson-600 px-5 py-3.5 text-sm font-bold text-white shadow-crimson-btn hover:bg-crimson-700 cursor-pointer"
              >
                <MapPin className="h-4 w-4" />
                Verificar meu CEP
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

function LandingAuthLink({ mobile = false }: { mobile?: boolean }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const href = isAuthenticated ? '/feed' : '/login';
  const label = isAuthenticated ? 'Abrir App' : 'Entrar';

  return (
    <Link
      href={href}
      className={
        mobile
          ? 'inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-50'
          : 'inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-zinc-800 hover:bg-zinc-50 transition-colors'
      }
    >
      <LogIn className="h-4 w-4 text-crimson-600" />
      <span>{label}</span>
    </Link>
  );
}
