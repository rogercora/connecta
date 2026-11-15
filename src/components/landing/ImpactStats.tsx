'use client';

import React from 'react';
import { Users, FileText, CheckCircle2, Trophy, ArrowUpRight } from 'lucide-react';

export const ImpactStats: React.FC = () => {
  const stats = [
    {
      icon: Users,
      value: '14.892',
      suffix: '+',
      label: 'Cidadãos Mobilizados',
      description: 'Moradores verificados por CEP participando ativamente.',
    },
    {
      icon: FileText,
      value: '182',
      suffix: '',
      label: 'Pautas Traduzidas por IA',
      description: 'Diários Oficiais lidos e explicados sem juridiquês.',
    },
    {
      icon: CheckCircle2,
      value: '94%',
      suffix: '',
      label: 'Protocolos Aceitos',
      description: 'Encaminhados formalmente à Câmara e Prefeitura.',
    },
    {
      icon: Trophy,
      value: '12',
      suffix: '',
      label: 'Conquistas nos Bairros',
      description: 'Obras e melhorias iniciadas por pressão popular.',
    },
  ];

  return (
    <section className="bg-white py-14 border-b border-[#EAE3D6]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="relative rounded-3xl border border-[#EAE3D6] bg-cream-50/50 p-6 transition-all hover:bg-cream-100/70 hover:shadow-xs"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-[#EAE3D6] text-terracotta-500 shadow-2xs">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 flex items-baseline gap-0.5">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-earth-900 sm:text-4xl">
                    {stat.value}
                  </span>
                  {stat.suffix && (
                    <span className="font-display text-2xl font-extrabold text-terracotta-500">
                      {stat.suffix}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 font-display text-base font-bold text-earth-900">
                  {stat.label}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-earth-600">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
