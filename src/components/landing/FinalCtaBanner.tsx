'use client';

import React from 'react';
import { MapPin, PenLine, Sparkles, HeartHandshake } from 'lucide-react';

interface FinalCtaBannerProps {
  onFocusCep: () => void;
  onOpenPetition: () => void;
}

export const FinalCtaBanner: React.FC<FinalCtaBannerProps> = ({ onFocusCep, onOpenPetition }) => {
  return (
    <section className="bg-white py-16 sm:py-20 border-b border-[#EAE3D6]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-terracotta-600 via-terracotta-700 to-terracotta-900 px-6 py-12 text-center text-white shadow-xl sm:px-14 sm:py-16">
          {/* Elementos decorativos de luz orgânica */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-cream-400/20 blur-2xl" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-cream-200 backdrop-blur-xs">
              <HeartHandshake className="h-3.5 w-3.5 text-cream-300" />
              Manifesto por Cidades Mais Vivas
            </span>

            <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              A política muda de verdade quando a gente ocupa a nossa rua.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base text-cream-100 sm:text-lg">
              Conecte-se com vizinhos reais, fiscalize as decisões do município e crie causas que transformam o seu bairro hoje mesmo.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
              <button
                type="button"
                onClick={onFocusCep}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-bold text-terracotta-800 shadow-lg transition-all hover:bg-cream-100 active:scale-[0.98] cursor-pointer"
              >
                <MapPin className="h-5 w-5 text-terracotta-600" />
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
