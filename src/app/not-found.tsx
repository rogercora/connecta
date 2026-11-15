import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <h2 className="font-display text-5xl font-extrabold text-zinc-950">404</h2>
      <p className="mt-3 text-lg font-medium text-zinc-600">Página não encontrada no ConectaBr.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-crimson-600 px-6 py-3 text-sm font-bold text-white shadow-crimson-btn transition-all hover:bg-crimson-700"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}

