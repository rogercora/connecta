'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CepParticipation } from './CepParticipation';
import { FeaturedPetitionCard } from './FeaturedPetitionCard';

interface HeroSectionProps {
  cepInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenPetition: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ cepInputRef, onOpenPetition }) => {
  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
        {/* Coluna esquerda: manifesto + mobilização */}
        <div className="lg:col-span-7">
          <span className="inline-flex flex-wrap items-center gap-x-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-800 sm:text-xs">
            Democracia participativa
            <span aria-hidden="true" className="text-sky-400">•</span>
            Piloto em São José dos Campos
          </span>

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-zinc-900 sm:text-5xl lg:text-[56px]">
            Quando os vizinhos se unem,{' '}
            <span className="text-orange-600 underline decoration-orange-200 decoration-[6px] underline-offset-[8px]">
              a cidade inteira
            </span>{' '}
            muda.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-700">
            Crie abaixo-assinados verificados para o seu bairro, vote nas decisões da Câmara traduzidas sem juridiquês e transforme a voz da sua rua em pressão real.
          </p>

          <div className="mt-8 max-w-2xl">
            <CepParticipation cepInputRef={cepInputRef} />

            <button
              type="button"
              onClick={onOpenPetition}
              className="group mt-5 inline-flex items-center gap-2 text-base font-semibold text-sky-700 underline-offset-4 hover:underline"
            >
              <span aria-hidden="true">✍️</span>
              Ou inicie um abaixo-assinado gratuito agora mesmo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Coluna direita: petição em destaque */}
        <div className="lg:col-span-5 lg:pt-4">
          <FeaturedPetitionCard />
        </div>
      </div>
    </section>
  );
};
