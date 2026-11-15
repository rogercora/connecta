'use client';

import React from 'react';
import { ArrowUp, BadgeCheck, Globe2, Sparkles } from 'lucide-react';
import { CITY_GOALS, formatNumber } from './shared';

interface CitiesRankingSectionProps {
  onFocusCep: () => void;
}

export const CitiesRankingSection: React.FC<CitiesRankingSectionProps> = ({ onFocusCep }) => {
  return (
    <section id="cidades" className="scroll-mt-24 border-b border-[#EAE3D6] bg-[#FAF7F2] py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-earth-700">
            <Globe2 className="h-3.5 w-3.5 text-terracotta-500" />
            Expansão Comunitária
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-earth-900 sm:text-4xl">
            Sua cidade ainda não está ativa? Puxe a fila.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-earth-600">
            Cada município é liberado conforme a vizinhança se cadastra. Ao atingir a meta, nossa IA começa a ler o Diário Oficial e a Câmara local.
          </p>
          <button
            type="button"
            onClick={onFocusCep}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-terracotta-500 px-6 py-3.5 text-base font-bold text-white shadow-hoperise-btn transition-all hover:bg-terracotta-600 active:scale-[0.98] cursor-pointer"
          >
            <ArrowUp className="h-4 w-4" />
            Colocar minha cidade na fila
          </button>
        </div>

        <ul className="space-y-3.5 lg:col-span-7">
          {CITY_GOALS.map((city) => {
            const pct = Math.min(100, Math.floor((city.current / city.goal) * 100));
            const missing = city.goal - city.current;

            return (
              <li
                key={city.name}
                className="rounded-3xl border border-[#EAE3D6] bg-white p-5 shadow-hoperise-card transition-all hover:shadow-hoperise-hover"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-extrabold text-earth-900">
                    {city.name} <span className="font-medium text-earth-500">({city.uf})</span>
                  </h3>
                  {city.active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-800">
                      <span className="h-2 w-2 rounded-full bg-sage-500" />
                      Ativa • {formatNumber(city.current)} cidadãos
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-100 px-3 py-1 text-xs font-bold text-terracotta-800">
                      <span className="h-2 w-2 rounded-full bg-terracotta-500" />
                      {formatNumber(city.current)} / {formatNumber(city.goal)} moradores
                    </span>
                  )}
                </div>

                <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-cream-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      city.active
                        ? 'bg-sage-500'
                        : 'bg-gradient-to-r from-terracotta-400 to-terracotta-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="mt-2.5 flex items-center gap-1.5 text-xs text-earth-600">
                  {city.active ? (
                    <>
                      <BadgeCheck className="h-4 w-4 text-sage-600" />
                      Piloto pioneiro com leitura diária do Diário Oficial
                    </>
                  ) : missing <= 40 ? (
                    <strong className="text-terracotta-600">Faltam apenas {missing} moradores para liberar!</strong>
                  ) : (
                    <span>
                      {pct}% da meta concluída • faltam {missing} moradores
                    </span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
