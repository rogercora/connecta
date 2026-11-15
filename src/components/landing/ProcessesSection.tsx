'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Megaphone,
  MapPin,
  ThumbsDown,
  ThumbsUp,
  Wrench,
  Users,
  Sparkles,
} from 'lucide-react';
import { CATEGORY_LABEL, ProcessCategory, ProcessItem, formatNumber } from './shared';

const BASE_PROCESSES: ProcessItem[] = [
  {
    id: 'p1',
    category: 'peticao',
    location: 'Jardim Satélite • SJC',
    title: 'Reabertura da UBS aos sábados',
    summary: 'Moradores pedem atendimento no fim de semana para quem trabalha em horário comercial e não consegue consulta preventiva.',
    supporters: 620,
    goal: 1000,
  },
  {
    id: 'l1',
    category: 'lei',
    location: 'Câmara de SJC',
    title: 'Novo limite de altura para prédios no Urbanova',
    summary: 'Na prática: prédios de até 12 andares poderão ser construídos perto das casas. Altera a ventilação e o trânsito da região.',
    supporters: 312,
    against: 88,
  },
  {
    id: 'z1',
    category: 'zeladoria',
    location: 'Vila Ema • SJC',
    title: 'Buraco de 2 metros na Rua Paulo Setúbal',
    summary: 'Já são 3 semanas sem reparo. Dois motociclistas caíram. Vizinhos estão cobrando formalmente a Secretaria de Manutenção.',
    supporters: 147,
  },
  {
    id: 'l2',
    category: 'lei',
    location: 'Câmara de SJC',
    title: 'Taxa do lixo passa a ser cobrada no IPTU',
    summary: 'Em resumo: quem tem imóvel de até 100m² pagará cerca de R$ 18 a mais por mês a partir do próximo exercício.',
    supporters: 129,
    against: 401,
  },
  {
    id: 'p2',
    category: 'peticao',
    location: 'Centro • Jacareí',
    title: 'Ciclovia contínua até a estação rodoviária',
    summary: 'Ligar os 4 trechos isolados de ciclovia e dar uma rota segura para quem se desloca diariamente até o trabalho.',
    supporters: 268,
    goal: 500,
  },
  {
    id: 'z2',
    category: 'zeladoria',
    location: 'Bosque dos Eucaliptos • SJC',
    title: 'Poda urgente de árvores sobre a fiação elétrica',
    summary: 'Galhos encostando nos fios em 6 quadras. Risco evidente de queda de energia e curto-circuito nas chuvas de verão.',
    supporters: 93,
  },
];

const TABS: { id: 'todos' | ProcessCategory; label: string }[] = [
  { id: 'todos', label: 'Todas as Causas' },
  { id: 'peticao', label: 'Abaixo-Assinados' },
  { id: 'lei', label: 'Projetos da Câmara' },
  { id: 'zeladoria', label: 'Zeladoria Urbana' },
];

const CATEGORY_STYLE: Record<ProcessCategory, { chip: string; icon: React.ElementType }> = {
  peticao: { chip: 'bg-crimson-50 text-crimson-800 border-crimson-200', icon: Megaphone },
  lei: { chip: 'bg-zinc-100 text-zinc-900 border-zinc-200', icon: FileText },
  zeladoria: { chip: 'bg-amber-50 text-amber-900 border-amber-200', icon: Wrench },
};

interface ProcessesSectionProps {
  userProcesses: ProcessItem[];
}

export const ProcessesSection: React.FC<ProcessesSectionProps> = ({ userProcesses }) => {
  const [activeTab, setActiveTab] = useState<'todos' | ProcessCategory>('todos');
  const [participation, setParticipation] = useState<Record<string, true | 'favor' | 'contra'>>({});
  const [votingOpen, setVotingOpen] = useState<string | null>(null);

  const items = useMemo(() => {
    const all = [...userProcesses, ...BASE_PROCESSES];
    return activeTab === 'todos' ? all : all.filter((p) => p.category === activeTab);
  }, [activeTab, userProcesses]);

  const counts = useMemo(() => {
    const all = [...userProcesses, ...BASE_PROCESSES];
    return {
      todos: all.length,
      peticao: all.filter((p) => p.category === 'peticao').length,
      lei: all.filter((p) => p.category === 'lei').length,
      zeladoria: all.filter((p) => p.category === 'zeladoria').length,
    };
  }, [userProcesses]);

  const support = (id: string) => setParticipation((prev) => ({ ...prev, [id]: true }));
  const vote = (id: string, choice: 'favor' | 'contra') => {
    setParticipation((prev) => ({ ...prev, [id]: choice }));
    setVotingOpen(null);
  };

  return (
    <section id="processos" className="scroll-mt-24 border-b border-zinc-200 bg-zinc-50/70 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-crimson-50 border border-crimson-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-crimson-700">
              <Megaphone className="h-3.5 w-3.5 text-crimson-600" />
              Mobilização Popular Ativa
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              Causas e decisões abertas no seu bairro
            </h2>
            <p className="mt-2 text-base text-zinc-600">
              Vote em leis locais ou apoie petições populares verificadas com um simples toque.
            </p>
          </div>

          {/* Abas em pílula */}
          <div
            role="tablist"
            aria-label="Filtrar processos"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-all cursor-pointer ${
                    active
                      ? 'border-crimson-600 bg-crimson-600 text-white shadow-crimson-btn'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
                      active ? 'bg-white/25 text-white' : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de causas */}
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const style = CATEGORY_STYLE[item.category];
            const Icon = style.icon;
            const mine = participation[item.id];

            let indicator: React.ReactNode;
            let action: React.ReactNode;

            if (item.category === 'lei') {
              const favor = item.supporters + (mine === 'favor' ? 1 : 0);
              const contra = (item.against ?? 0) + (mine === 'contra' ? 1 : 0);
              const pctFavor = Math.round((favor / (favor + contra)) * 100);

              indicator = (
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-crimson-700 font-bold">{pctFavor}% a favor</span>
                    <span className="text-zinc-500">{formatNumber(favor + contra)} votos da cidade</span>
                  </div>
                  <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-zinc-200">
                    <div className="bg-crimson-600 transition-all duration-500" style={{ width: `${pctFavor}%` }} />
                    <div className="bg-zinc-800 transition-all duration-500" style={{ width: `${100 - pctFavor}%` }} />
                  </div>
                </div>
              );

              if (mine) {
                action = (
                  <p className="flex items-center justify-center gap-1.5 rounded-full bg-crimson-50 border border-crimson-200 py-3 text-sm font-bold text-crimson-800">
                    <CheckCircle2 className="h-4 w-4 text-crimson-600" />
                    Você votou {mine === 'favor' ? 'a favor' : 'contra'}
                  </p>
                );
              } else if (votingOpen === item.id) {
                action = (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => vote(item.id, 'favor')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-crimson-600 bg-crimson-600 py-2.5 text-xs font-bold text-white hover:bg-crimson-700 shadow-crimson-btn cursor-pointer"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> A favor
                    </button>
                    <button
                      type="button"
                      onClick={() => vote(item.id, 'contra')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-zinc-900 bg-zinc-900 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" /> Contra
                    </button>
                  </div>
                );
              } else {
                action = (
                  <button
                    type="button"
                    onClick={() => setVotingOpen(item.id)}
                    className="w-full rounded-full border border-zinc-300 bg-white py-3 text-sm font-bold text-zinc-900 transition-all hover:bg-zinc-100 cursor-pointer"
                  >
                    Votar nesta Lei
                  </button>
                );
              }
            } else {
              const supporters = item.supporters + (mine ? 1 : 0);
              const pct = item.goal ? Math.min(100, (supporters / item.goal) * 100) : null;

              indicator = (
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1 text-zinc-900 font-bold">
                      <Users className="h-3.5 w-3.5 text-crimson-600" />
                      {formatNumber(supporters)} apoios
                    </span>
                    {item.goal ? (
                      <span className="text-zinc-500">meta de {formatNumber(item.goal)}</span>
                    ) : (
                      <span className="text-zinc-500">moradores afetados</span>
                    )}
                  </div>
                  {pct !== null && (
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-crimson-500 to-crimson-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );

              action = mine ? (
                <p className="flex items-center justify-center gap-1.5 rounded-full bg-crimson-50 border border-crimson-200 py-3 text-sm font-bold text-crimson-800">
                  <CheckCircle2 className="h-4 w-4 text-crimson-600" />
                  {item.category === 'peticao' ? 'Você assinou' : 'Você está cobrando junto'}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => support(item.id)}
                  className={`w-full rounded-full py-3 text-sm font-bold transition-all cursor-pointer ${
                    item.category === 'peticao'
                      ? 'bg-crimson-600 text-white shadow-crimson-btn hover:bg-crimson-700'
                      : 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {item.category === 'peticao' ? 'Apoiar Causa' : 'Cobrar Zeladoria'}
                </button>
              );
            }

            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-civic-card transition-all hover:shadow-civic-hover"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-bold ${style.chip}`}
                    >
                      <Icon className="h-3 w-3" />
                      {CATEGORY_LABEL[item.category]}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-zinc-500">
                      <MapPin className="h-3 w-3 text-zinc-400" />
                      {item.location}
                    </span>
                  </div>

                  <h3 className="mt-3.5 font-display text-lg font-extrabold leading-snug text-zinc-950">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-6 border-t border-zinc-100 pt-4">
                  {indicator}
                  <div className="mt-4">{action}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
