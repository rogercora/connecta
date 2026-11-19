'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, MessageSquare, X } from 'lucide-react';
import { useFeedStore } from '@/stores/feedStore';

export const Header: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchQuery = useFeedStore((s) => s.searchQuery);
  const setSearchQuery = useFeedStore((s) => s.setSearchQuery);
  const pathname = usePathname();
  const router = useRouter();

  const handleToggleSearch = () => {
    setSearchOpen((prev) => {
      if (prev && searchQuery) {
        setSearchQuery('');
      }
      return !prev;
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 min-h-14 bg-white/95 backdrop-blur-md border-b border-zinc-200 z-40 px-4">
      <div className="max-w-md mx-auto h-14 flex items-center justify-between">
        {/* Logo ConectaBr com Megafone Cívico (Fundo Branco) */}
        <Link href="/feed" className="flex items-center gap-2.5 select-none group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-xs group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 40 40" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 12 16 L 22 12 L 22 28 L 12 24 Z"
                fill="#E11D48"
                stroke="#BE123C"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <rect x="8" y="17" width="4.5" height="6" rx="1" fill="#18181B" />
              <path d="M 14 24 L 16 30 L 19 30 L 17 24" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 25 15 A 8 8 0 0 1 25 25" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 29 12 A 13 13 0 0 1 29 28" stroke="#FB7185" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-display font-extrabold text-xl tracking-tight text-zinc-950">
            Conecta<span className="text-crimson-600">Br</span>
          </span>
        </Link>

        {/* Ícones de ação no topo direito */}
        <div className="flex items-center space-x-3 text-zinc-700">
          <button
            type="button"
            onClick={handleToggleSearch}
            aria-label="Pesquisar"
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              searchOpen || searchQuery
                ? 'bg-crimson-50 text-crimson-600'
                : 'hover:bg-zinc-100 hover:text-crimson-600'
            }`}
          >
            {searchOpen ? <X className="w-5 h-5 stroke-[2]" /> : <Search className="w-5 h-5 stroke-[2]" />}
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

      {searchOpen && (
        <div className="max-w-md mx-auto px-4 pb-3 animate-fadeIn">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pathname !== '/feed') {
                router.push('/feed');
              }
            }}
            className="relative"
          >
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ocorrência no bairro, protocolo ou categoria..."
              className="w-full pl-9 pr-9 py-2 bg-zinc-100 border border-zinc-200 rounded-full text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-crimson-600 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
};
