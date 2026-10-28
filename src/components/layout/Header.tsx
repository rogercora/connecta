'use client';

import React from 'react';
import Link from 'next/link';
import { Search, MessageSquare } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-40 px-4">
      <div className="max-w-md mx-auto h-full flex items-center justify-between">
        {/* Logo Conecta */}
        <Link href="/feed" className="flex items-center select-none group">
          <span className="font-black text-2xl tracking-tighter text-gray-900 group-hover:text-emerald-600 transition-colors">
            Conecta
          </span>
        </Link>

        {/* Ícones de ação no topo direito */}
        <div className="flex items-center space-x-3.5 text-gray-800">
          <button
            aria-label="Pesquisar"
            className="p-1 hover:text-emerald-600 transition-colors"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>
          <Link
            href="/mensagens"
            aria-label="Mensagens"
            className="p-1 hover:text-emerald-600 transition-colors"
          >
            <MessageSquare className="w-5 h-5 stroke-[2]" />
          </Link>
        </div>
      </div>
    </header>
  );
};
