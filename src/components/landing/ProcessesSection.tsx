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
} from 'lucide-react';
import { CATEGORY_LABEL, ProcessCategory, ProcessItem, formatNumber } from './shared';

const BASE_PROCESSES: ProcessItem[] = [
  {
    id: 'p1',
    category: 'peticao',
    location: 'Jardim Satélite • SJC',
    title: 'Reabertura da UBS aos sábados',
    summary: 'Moradores pedem atendimento no fim de semana para quem trabalha em horário comercial e não consegue consulta.',
    supporters: 620,
    goal: 1000,
  },
  {
    id: 'l1',
    category: 'lei',
    location: 'Câmara de SJC',
    title: 'Novo limite de altura para prédios no Urbanova',
    summary: 'Na prática: prédios de até 12 andares poderão ser construídos perto das casas. Muda a ventilação e o trânsito da região.',
    supporters: 312,
    against: 88,
  },
  {
    id: 'z1',
    category: 'zeladoria',
    location: 'Vila Ema • SJC',
    title: 'Buraco de 2 metros na Rua Paulo Setúbal',
    summary: 'Já são 3 semanas sem reparo. Dois motociclistas caíram. Vizinhos estão cobrando a Secretaria de Manutenção.',
    supporters: 147,
  },
  {
    id: 'l2',
    category: 'lei',
    location: 'Câmara de SJC',
    title: 'Taxa do lixo passa a ser cobrada no IPTU',
    summary: 'Em resumo: quem tem imóvel de até 100m² pagará cerca de R$ 18 a mais por mês a partir de 2027.',
    supporters: 129,
    against: 401,
  },
  {
    id: 'p2',
    category: 'peticao',
    location: 'Centro • Jacareí',
    title: 'Ciclovia contínua até a estação rodoviária',
    summary: 'Ligar os 4 trechos isolados de ciclovia e dar uma rota segura para quem vai trabalhar de bicicleta.',
    supporters: 268,
    goal: 500,
  },
  {
    id: 'z2',
    category: 'zeladoria',
    location: 'Bosque dos Eucaliptos • SJC',
    title: 'Poda urgente de árvores sobre a fiação',
    summary: 'Galhos encostando nos fios em 6 quadras. Risco de queda de energia e incêndio na próxima chuva forte.',
    supporters: 93,
  },
];

const TABS: { id: 'todos' | ProcessCategory; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'peticao', label: 'Abaixo-Assinados' },
  { id: 'lei', label: 'Leis da Câmara (IA)' },
  { id: 'zeladoria', label: 'Zeladoria do Bairro' },
];

const CATEGORY_STYLE: Record<ProcessCategory, { chip: string; icon: React.ElementType }> = {
  peticao: { chip: 'bg-orange-50 text-orange-800 border-orange-200', icon: Megaphone },
  lei: { chip: 'bg-sky-50 text-sky-800 border-sky-200', icon: FileText },
  zeladoria: { chip: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Wrench },
};

interface ProcessesSectionProps {
  userProcesses: ProcessItem[];
}

export const ProcessesSection: React.FC<ProcessesSectionProps> = ({ userProcesses }) => {
  const [activeTab, setActiveTab] = useState<'todos' | ProcessCategory>('todos');
  /** Participação local: apoio (true) ou voto em leis ('favor' | 'contra'). */
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
    <section id="processos" className="scroll-mt-28 border-y border-zinc-200 bg-[#F4F5F7] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-sky-700">Processos participativos</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              O que está sendo decidido agora
            </h2>
          </div>

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
                  className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 text-xs ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                    <span className="text-emerald-700">{pctFavor}% a favor</span>
                    <span className="text-zinc-500">{formatNumber(favor + contra)} votos</span>
                  </div>
                  <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-zinc-200">
                    <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${pctFavor}%` }} />
                    <div className="bg-red-400 transition-all duration-500" style={{ width: `${100 - pctFavor}%` }} />
                  </div>
                </div>
              );

              if (mine) {
                action = (
                  <p className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Você votou {mine === 'favor' ? 'a favor' : 'contra'}
                  </p>
                );
              } else if (votingOpen === item.id) {
                action = (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => vote(item.id, 'favor')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-emerald-600 bg-white py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                    >
                      <ThumbsUp className="h-4 w-4" /> A favor
                    </button>
                    <button
                      type="button"
                      onClick={() => vote(item.id, 'contra')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-red-600 bg-white py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                    >
                      <ThumbsDown className="h-4 w-4" /> Contra
                    </button>
                  </div>
                );
              } else {
                action = (
                  <button
                    type="button"
                    onClick={() => setVotingOpen(item.id)}
                    className="w-full rounded-lg border-2 border-zinc-900 bg-white py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
                  >
                    Participar / Votar
                  </button>
                );
              }
            } else {
              const supporters = item.supporters + (mine ? 1 : 0);
              const pct = item.goal ? Math.min(100, (supporters / item.goal) * 100) : null;

              indicator = (
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1 text-zinc-800">
                      <Users className="h-3.5 w-3.5 text-zinc-500" />
                      {formatNumber(supporters)} apoios
                    </span>
                    {item.goal ? (
                      <span className="text-zinc-500">meta {formatNumber(item.goal)}</span>
                    ) : (
                      <span className="text-zinc-500">moradores afetados</span>
                    )}
                  </div>
                  {pct !== null && (
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-orange-100">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );

              action = mine ? (
                <p className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  {item.category === 'peticao' ? 'Você assinou' : 'Você está cobrando junto'}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => support(item.id)}
                  className={`w-full rounded-lg py-2.5 text-sm font-bold transition-colors ${
                    item.category === 'peticao'
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'border-2 border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  {item.category === 'peticao' ? 'Participar / Assinar' : 'Participar / Cobrar'}
                </button>
              );
            }

            return (
              <article
                key={item.id}
                className={`flex flex-col rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${
                  item.isUserCreated ? 'border-orange-400 ring-2 ring-orange-200' : 'border-zinc-200'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-bold ${style.chip}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {CATEGORY_LABEL[item.category]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {item.location}
                  </span>
                  {item.isUserCreated && (
                    <span className="rounded-md bg-orange-600 px-2 py-0.5 text-[11px] font-bold text-white">Nova • sua</span>
                  )}
                </div>

                <h3 className="mt-3 font-display text-lg font-bold leading-snug text-zinc-900">{item.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">{item.summary}</p>

                <div className="mt-auto space-y-4 pt-5">
                  {indicator}
                  {action}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

