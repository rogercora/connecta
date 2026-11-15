'use client';

import React from 'react';
import { MapPin, PenLine, Megaphone } from 'lucide-react';

interface FinalCtaBannerProps {
  onFocusCep: () => void;
  onOpenPetition: () => void;
}

export const FinalCtaBanner: React.FC<FinalCtaBannerProps> = ({ onFocusCep, onOpenPetition }) => {
  return (
    <section className="bg-white py-16 sm:py-20 border-b border-zinc-200">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-crimson-600 via-crimson-700 to-zinc-950 px-6 py-12 text-center text-white shadow-xl sm:px-14 sm:py-16">
          {/* Luzes orgânicas de fundo */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-crimson-400/20 blur-2xl" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-100 backdrop-blur-xs">
              <Megaphone className="h-3.5 w-3.5 text-rose-200" />
              Manifesto por Democracia Direta
            </span>

            <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              A política muda de verdade quando a gente ocupa a nossa rua.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base text-rose-100/90 sm:text-lg">
              Conecte-se com vizinhos reais, fiscalize as decisões do município e crie causas que transformam o seu bairro hoje mesmo.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
              <button
                type="button"
                onClick={onFocusCep}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-bold text-crimson-700 shadow-lg transition-all hover:bg-zinc-100 active:scale-[0.98] cursor-pointer"
              >
                <MapPin className="h-5 w-5 text-crimson-600" />
                Verificar meu CEP
              </button>
              <button
                type="button"
                onClick={onOpenPetition}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur-xs transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
              >
                <PenLine className="h-5 w-5" />
                Criar Abaixo-Assinado Gratuito
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
