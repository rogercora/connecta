import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Sparkles, Sliders, FileText } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 text-gray-900 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/feed"
              className="flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver App do Cidadão</span>
            </Link>

            <div className="h-4 w-px bg-gray-200 hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                C
              </span>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-gray-900 leading-tight flex items-center space-x-1">
                  <span>Connecta Admin</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full ml-1">
                    SJC Piloto
                  </span>
                </h1>
                <p className="text-[10px] text-gray-500 leading-none">
                  Moderação Cívica & Ingestão de IA
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-bold">Modo Semi-Automático Ativo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-400">
        Connecta — Plataforma Cívica Geolocalizada • São José dos Campos - SP
      </footer>
    </div>
  );
}

