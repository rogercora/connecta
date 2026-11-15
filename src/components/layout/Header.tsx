'use client';

import React from 'react';
import Link from 'next/link';
import { Search, MessageSquare } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-zinc-200 z-40 px-4">
      <div className="max-w-md mx-auto h-full flex items-center justify-between">
        {/* Logo ConectaBr com Megafone Cívico */}
        <Link href="/feed" className="flex items-center gap-2 select-none group">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-xs group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 40 40" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 12 16 L 22 12 L 22 28 L 12 24 Z"
                fill="#E11D48"
                stroke="#E11D48"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <rect x="8" y="17" width="5" height="6" rx="1.5" fill="#FFFFFF" />
              <path d="M 14 24 L 16 30 L 19 30 L 17 24" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 26 14 A 9 9 0 0 1 26 26" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 30 11 A 14 14 0 0 1 30 29" stroke="#FB7185" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-display font-extrabold text-xl tracking-tight text-zinc-950">
            Conecta<span className="text-crimson-600">Br</span>
          </span>
        </Link>

        {/* Ícones de ação no topo direito */}
        <div className="flex items-center space-x-3 text-zinc-700">
          <button
            aria-label="Pesquisar"
            className="p-1.5 rounded-full hover:bg-zinc-100 hover:text-crimson-600 transition-colors"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>
          <Link
            href="/mensagens"
            aria-label="Mensagens"
            className="p-1.5 rounded-full hover:bg-zinc-100 hover:text-crimson-600 transition-colors"
          >
            <MessageSquare className="w-5 h-5 stroke-[2]" />
          </Link>
        </div>
      </div>
    </header>
  );
};
