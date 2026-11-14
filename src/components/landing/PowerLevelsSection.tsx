import React from 'react';
import { MapPin, Building2, Landmark } from 'lucide-react';

const levels = [
  {
    level: 'Nível 01',
    title: 'Meu Bairro',
    badge: 'Hiperlocal • Seu CEP',
    accent: 'emerald',
    icon: MapPin,
    description:
      'Buracos, podas, iluminação, obras na sua rua e zeladoria cobrada diretamente por quem mora ali — com pressão coletiva e prova de impacto local.',
    examples: ['Buraco na Av. Andrômeda', 'Ponto de ônibus sem luz', 'Alteração de mão única'],
  },
  {
    level: 'Nível 02',
    title: 'Minha Cidade',
    badge: 'Municipal',
    accent: 'amber',
    icon: Building2,
    description:
      'Votações da Câmara de Vereadores, orçamento anual, contratos de transporte público e decretos do Prefeito traduzidos sem blindagem política.',
    examples: ['Tarifa de ônibus e subsídio', 'Contratos sem licitação', 'Lei de Zoneamento e IPTU'],
  },
  {
    level: 'Nível 03',
    title: 'Brasil',
    badge: 'Federal',
    accent: 'zinc',
    icon: Landmark,
    description:
      'Leis nacionais e pautas do Congresso que afetam o seu dia a dia, impostos e direitos — para você se posicionar junto da sua comunidade.',
    examples: ['Reformas tributárias', 'Pautas de segurança pública', 'Orçamento e políticas sociais'],
  },
] as const;

export const PowerLevelsSection: React.FC = () => {
  return (
    <section className="border-t border-zinc-800/70 bg-[#09090B] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Arquitetura do Feed
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Os 3 Níveis de Poder, filtrados pelo seu endereço
          </h2>
          <p className="mt-3 text-base text-zinc-400">
            Sem ruído nacional quando o problema é na esquina, e sem perder de vista o que decidem em Brasília.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {levels.map((item) => {
            const Icon = item.icon;
            const iconStyle =
              item.accent === 'emerald'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : item.accent === 'amber'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 bg-zinc-800/80 text-zinc-200';

            const badgeStyle =
              item.accent === 'emerald'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : item.accent === 'amber'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-zinc-700 bg-zinc-800/70 text-zinc-300';

            return (
              <div
                key={item.title}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-800 bg-[#121215] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-zinc-700 sm:p-7"
              >
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border ${iconStyle}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeStyle}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {item.level}
                  </p>
                  <h3 className="font-display mt-1 text-xl font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-zinc-800/80 pt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Exemplos no feed
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.examples.map((ex) => (
                      <span
                        key={ex}
                        className="rounded-md border border-zinc-800 bg-[#09090B] px-2.5 py-1 text-xs text-zinc-300"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

