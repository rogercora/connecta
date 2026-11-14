import React from 'react';
import { MapPinned, BellRing, Share2, Landmark } from 'lucide-react';

const STEPS = [
  {
    icon: MapPinned,
    title: 'Você entra pelo seu CEP',
    text: 'Sem perfis fakes ou robôs. Cada conta é vinculada a um morador real.',
  },
  {
    icon: BellRing,
    title: 'Acompanha e Propõe',
    text: 'Receba alertas claros sobre obras, leis e gastos da sua rua ou crie sua própria petição em 2 minutos.',
  },
  {
    icon: Share2,
    title: 'Mobiliza a Vizinhança',
    text: 'Compartilhe o link no grupo do condomínio ou do bairro e veja o contador subir em tempo real.',
  },
  {
    icon: Landmark,
    title: 'Pressão Institucional',
    text: 'Atingiu a meta? Geramos o dossiê oficial com assinaturas auditadas para protocolar na Câmara ou Prefeitura.',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="como-funciona" className="scroll-mt-28 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-sky-700">Como funciona</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Como funciona o poder coletivo
          </h2>
          <p className="mt-3 text-lg text-zinc-600">
            Do problema na esquina ao protocolo oficial, em quatro passos.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative flex flex-col bg-white p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="font-display text-5xl font-extrabold leading-none text-orange-500 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 text-zinc-800">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="mt-6 font-display text-lg font-bold text-zinc-900">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

