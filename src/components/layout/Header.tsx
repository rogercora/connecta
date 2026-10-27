'use client';

import React from 'react';
import Link from 'next/link';
import { Search, MessageSquare } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-40 px-4">
      <div className="max-w-md mx-auto h-full flex items-center justify-between">
        {/* Logo Cidadão Connect */}
        <Link href="/feed" className="flex flex-col leading-tight select-none">
          <span className="font-extrabold text-base tracking-tight text-gray-900">
            Cidadão
          </span>
          <span className="font-extrabold text-base tracking-tight text-gray-900 -mt-1.5">
            Connect
          </span>
        </Link>

        {/* Ícones de ação no topo direito */}
        <div className="flex items-center space-x-3 text-gray-800">
          <button
            aria-label="Pesquisar"
            className="p-1 hover:text-emerald-600 transition-colors"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>
          <Link
            href="/mensagens"
            aria-label="Mensagens"
            className="p-1 hover:text-emerald-600 transition-colors"
          >
            <MessageSquare className="w-5 h-5 stroke-[2.2]" />
          </Link>
        </div>
      </div>
    </header>
  );
};

