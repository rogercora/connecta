'use client';

import React from 'react';
import { ArrowUp, BadgeCheck } from 'lucide-react';
import { CITY_GOALS, formatNumber } from './shared';

interface CitiesRankingSectionProps {
  onFocusCep: () => void;
}

export const CitiesRankingSection: React.FC<CitiesRankingSectionProps> = ({ onFocusCep }) => {
  return (
    <section id="cidades" className="scroll-mt-28 border-y border-zinc-200 bg-[#F4F5F7] py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <p className="text-sm font-bold uppercase tracking-wider text-sky-700">Expansão nacional</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Sua cidade ainda não está ativa? Puxe a mobilização.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600">
            Cada cidade é liberada quando um número mínimo de moradores verificados entra na fila. Quanto mais vizinhos, mais rápido.
          </p>
          <button
            type="button"
            onClick={onFocusCep}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 text-base font-bold text-white shadow-sm hover:bg-orange-700"
          >
            <ArrowUp className="h-4 w-4" />
            Colocar minha cidade na fila
          </button>
        </div>

        <ul className="space-y-3 lg:col-span-7">
          {CITY_GOALS.map((city) => {
            const pct = Math.min(100, Math.floor((city.current / city.goal) * 100));
            const missing = city.goal - city.current;

            return (
              <li key={city.name} className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-zinc-900">
                    {city.name} <span className="text-zinc-500">({city.uf})</span>
                  </h3>
                  {city.active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Ativa • {formatNumber(city.current)} cidadãos verificados
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      {formatNumber(city.current)} / {formatNumber(city.goal)} moradores
                    </span>
                  )}
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full ${city.active ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-400 to-orange-600'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-600">
                  {city.active ? (
                    <>
                      <BadgeCheck className="h-4 w-4 text-emerald-600" />
                      Piloto oficial em funcionamento
                    </>
                  ) : missing <= 40 ? (
                    <strong className="text-orange-700">Faltam {missing} para liberar!</strong>
                  ) : (
                    <span>
                      {pct}% da meta • faltam {missing} moradores
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
