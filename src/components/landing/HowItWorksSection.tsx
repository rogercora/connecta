import React from 'react';
import { MapPinned, BellRing, Share2, Landmark, Megaphone } from 'lucide-react';

const STEPS = [
  {
    icon: MapPinned,
    title: '1. Você entra com seu CEP',
    text: 'Sem perfis falsos ou robôs. Cada cidadão é verificado no seu bairro ou cidade.',
  },
  {
    icon: BellRing,
    title: '2. Acompanha o que muda',
    text: 'Nossa IA lê o Diário Oficial e avisa o que impacta sua rua, seu bolso e sua rotina.',
  },
  {
    icon: Share2,
    title: '3. Mobiliza a Vizinhança',
    text: 'Crie ou assine causas em 1 clique e compartilhe no WhatsApp do bairro e condomínio.',
  },
  {
    icon: Landmark,
    title: '4. Protocolo Oficial',
    text: 'Atingiu a meta? Geramos o documento com assinaturas auditadas para entregar na Prefeitura e Câmara.',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="como-funciona" className="scroll-mt-24 border-b border-zinc-200 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-crimson-50 border border-crimson-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-crimson-700">
            <Megaphone className="h-3.5 w-3.5 text-crimson-600" />
            Democracia Direta e Aberta
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            Como transformamos ideias em conquistas
          </h2>
          <p className="mt-2 text-base text-zinc-600">
            Da pauta no Diário Oficial à melhoria na sua calçada, em quatro etapas simples.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative flex flex-col justify-between rounded-3xl border border-zinc-200 bg-zinc-50/60 p-7 shadow-civic-card transition-all hover:bg-zinc-100/70 hover:shadow-civic-hover"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-zinc-200 text-crimson-600 shadow-2xs">
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </span>
                    <span className="font-display text-4xl font-extrabold text-zinc-300 tabular-nums">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-lg font-bold text-zinc-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {step.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
