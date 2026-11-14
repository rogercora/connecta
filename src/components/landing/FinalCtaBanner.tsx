'use client';

import React from 'react';
import { MapPin, PenLine } from 'lucide-react';

interface FinalCtaBannerProps {
  onFocusCep: () => void;
  onOpenPetition: () => void;
}

export const FinalCtaBanner: React.FC<FinalCtaBannerProps> = ({ onFocusCep, onOpenPetition }) => {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border-2 border-orange-500 bg-orange-50/40 px-6 py-10 text-center sm:px-12 sm:py-14">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-700">Manifesto</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-4xl">
            A política muda quando a gente ocupa o espaço. Comece pela sua rua.
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onFocusCep}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-900 bg-white px-6 py-3.5 text-base font-bold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              <MapPin className="h-5 w-5" />
              Verificar meu CEP
            </button>
            <button
              type="button"
              onClick={onOpenPetition}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-base font-bold text-white shadow-sm shadow-orange-600/30 transition-colors hover:bg-orange-700"
            >
              <PenLine className="h-5 w-5" />
              Criar Abaixo-Assinado
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

