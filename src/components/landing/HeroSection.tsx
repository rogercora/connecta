'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Megaphone } from 'lucide-react';
import { CepParticipation } from './CepParticipation';
import { FeaturedPetitionCard } from './FeaturedPetitionCard';

interface HeroSectionProps {
  cepInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenPetition: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ cepInputRef, onOpenPetition }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-zinc-50/60 to-white py-12 sm:py-16 lg:py-20 border-b border-zinc-200">
      {/* Luzes difusas de fundo em carmesim sutil */}
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-crimson-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-zinc-200/50 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
        {/* Coluna esquerda: Manifesto e Mobilização */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-crimson-200 bg-crimson-50/80 px-4 py-1.5 text-xs font-bold text-crimson-800 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-crimson-600" />
            Democracia Direta • Piloto Aberto em São José dos Campos
          </div>

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl lg:text-[56px]">
            Quando os vizinhos se unem,{' '}
            <span className="relative inline-block text-crimson-600">
              a cidade inteira
            </span>{' '}
            muda pra melhor.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-700">
            Acompanhe projetos da Câmara traduzidos pela nossa IA sem juridiquês, crie abaixo-assinados reais para o seu bairro e transforme a indignação da sua rua em pressão legítima.
          </p>

          <div className="mt-8 max-w-2xl">
            <CepParticipation cepInputRef={cepInputRef} />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={onOpenPetition}
                className="group inline-flex items-center gap-2 text-sm font-bold text-crimson-600 underline-offset-4 hover:text-crimson-700 hover:underline cursor-pointer"
              >
                <Megaphone className="h-4 w-4" />
                <span>Ou inicie um abaixo-assinado gratuito para o seu bairro</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                <ShieldCheck className="h-4 w-4 text-crimson-600" />
                <span>Moradores reais verificados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita: Causa em Destaque */}
        <div className="lg:col-span-5 lg:pt-3">
          <FeaturedPetitionCard />
        </div>
      </div>
    </section>
  );
};
