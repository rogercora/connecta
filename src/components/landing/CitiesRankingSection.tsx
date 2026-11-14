'use client';

import React from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';

interface CitiesRankingSectionProps {
  onFocusCep: () => void;
}

const cities = [
  {
    name: 'São José dos Campos (SP)',
    status: 'active' as const,
    statusLabel: '🟢 Ativa (Piloto Oficial)',
    progressText: '100% liberada • Leitura diária ao vivo',
    pct: 100,
  },
  {
    name: 'Jacareí (SP)',
    status: 'queue' as const,
    statusLabel: '🟡 241 / 300 moradores (80% para liberar)',
    progressText: 'Faltam 59 moradores verificados',
    pct: 80,
  },
  {
    name: 'Taubaté (SP)',
    status: 'queue' as const,
    statusLabel: '🟡 165 / 300 moradores (55% para liberar)',
    progressText: 'Faltam 135 moradores verificados',
    pct: 55,
  },
  {
    name: 'Campinas (SP)',
    status: 'queue' as const,
    statusLabel: '🟡 112 / 300 moradores (37% para liberar)',
    progressText: 'Faltam 188 moradores verificados',
    pct: 37,
  },
];

export const CitiesRankingSection: React.FC<CitiesRankingSectionProps> = ({
  onFocusCep,
}) => {
  return (
    <section
      id="cidades"
      className="border-t border-zinc-800/70 bg-[#09090B] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Meta de Expansão
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ranking de Liberação de Cidades
          </h2>
          <p className="mt-3 text-base text-zinc-400">
            Liberamos o monitoramento automático assim que a comunidade local atinge 300 moradores verificados.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-800 bg-[#121215] divide-y divide-zinc-800/80">
          {cities.map((city) => {
            const isActive = city.status === 'active';
            return (
              <div
                key={city.name}
                className="flex flex-col gap-4 p-5 transition-colors hover:bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div className="flex items-start gap-3.5 sm:items-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      isActive
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-white sm:text-lg">
                      {city.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-400">{city.progressText}</p>
                  </div>
                </div>

                <div className="w-full sm:w-72">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold">
                    <span className={isActive ? 'text-emerald-300' : 'text-amber-300'}>
                      {city.statusLabel}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isActive
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-amber-500 to-amber-300'
                      }`}
                      style={{ width: `${city.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onFocusCep}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3.5 text-sm font-semibold text-emerald-300 transition-all hover:border-emerald-400 hover:bg-emerald-500/20"
          >
            <span>Não viu sua cidade? Cadastre seu CEP no topo e puxe a fila.</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

