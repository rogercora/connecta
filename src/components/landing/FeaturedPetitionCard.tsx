'use client';

import React, { useState } from 'react';
import { CheckCircle2, Flame, MessageCircle, PenLine, ShieldCheck } from 'lucide-react';
import { buildWhatsAppUrl, formatNumber } from './shared';

const GOAL = 1000;
const INITIAL = 842;
const RECENT_SIGNERS = ['MS', 'CR', 'AL', 'JP', 'BF'];

export const FeaturedPetitionCard: React.FC = () => {
  const [signed, setSigned] = useState(false);
  const signatures = INITIAL + (signed ? 1 : 0);
  const pct = Math.min(100, (signatures / GOAL) * 100);

  const shareText =
    'Acabei de assinar a causa: "Faixa elevada e semáforo inteligente na Av. Andrômeda". Mais de 400 crianças atravessam ali todo dia. Assine também com 1 clique:';

  return (
    <article className="relative rounded-3xl border border-zinc-200 bg-white p-6 shadow-civic-card sm:p-8 transition-all hover:shadow-civic-hover">
      {/* Badge de Urgência */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-crimson-50 border border-crimson-200/80 px-3.5 py-1 text-xs font-bold text-crimson-800">
          <Flame className="h-3.5 w-3.5 text-crimson-600" />
          Causa Urgente • Jardim Satélite (SJC)
        </span>
        <span className="text-xs font-semibold text-zinc-500">Protocolo em 4 dias</span>
      </div>

      <h2 className="mt-4 font-display text-xl font-extrabold leading-snug text-zinc-950 sm:text-2xl">
        Instalação de faixa elevada e semáforo inteligente na Av. Andrômeda
      </h2>

      {/* Relato humano */}
      <blockquote className="mt-3.5 rounded-2xl border-l-4 border-crimson-600 bg-zinc-50 p-3.5 text-sm leading-relaxed text-zinc-800">
        “Mais de 400 crianças atravessam aqui todos os dias sem sinalização adequada. Vamos protocolar este pedido na Secretaria de Mobilidade.”
        <footer className="mt-1.5 text-xs font-semibold text-zinc-500">
          — Ana L., mãe e moradora há 11 anos
        </footer>
      </blockquote>

      {/* Termômetro de meta */}
      <div className="mt-6">
        <div className="flex items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Progresso da meta</span>
            <p className="mt-0.5 text-sm text-zinc-700">
              <strong
                key={signatures}
                className="font-display text-2xl font-extrabold text-zinc-950 tabular-nums animate-[pulse_0.6s_ease-out_1]"
              >
                {formatNumber(signatures)}
              </strong>{' '}
              de {formatNumber(GOAL)} assinaturas
            </p>
          </div>
          <span className="rounded-full bg-crimson-50 border border-crimson-200 px-3 py-1 font-display text-sm font-extrabold text-crimson-700 tabular-nums">
            {Math.round(pct)}%
          </span>
        </div>

        <div
          className="mt-2.5 h-3.5 w-full overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-valuenow={signatures}
          aria-valuemin={0}
          aria-valuemax={GOAL}
          aria-label="Assinaturas da petição"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-crimson-500 to-crimson-600 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Faltam apenas <strong className="font-semibold text-zinc-900">{GOAL - signatures}</strong> assinaturas de moradores para o protocolo oficial.
        </p>
      </div>

      {/* Assinantes recentes com avatares */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex -space-x-2">
          {(signed ? ['VC', ...RECENT_SIGNERS.slice(0, 4)] : RECENT_SIGNERS).map((initials, i) => (
            <span
              key={`${initials}-${i}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold shadow-xs ${
                initials === 'VC'
                  ? 'bg-crimson-600 text-white'
                  : 'bg-zinc-200 text-zinc-800'
              }`}
            >
              {initials}
            </span>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          {signed ? 'Você e mais 47 vizinhos apoiaram hoje' : '47 vizinhos apoiaram esta causa hoje'}
        </p>
      </div>

      {/* Botão de ação */}
      {!signed ? (
        <button
          type="button"
          onClick={() => setSigned(true)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-crimson-600 px-6 py-4 text-base font-bold text-white shadow-crimson-btn transition-all hover:bg-crimson-700 active:scale-[0.98] cursor-pointer"
        >
          <PenLine className="h-5 w-5" />
          Apoiar esta Causa com 1 Clique
        </button>
      ) : (
        <div className="mt-6 rounded-2xl border-2 border-crimson-200 bg-crimson-50/70 p-4 transition-all" role="status">
          <p className="flex items-center gap-2 font-display text-base font-extrabold text-crimson-900">
            <CheckCircle2 className="h-5 w-5 text-crimson-600" />
            Apoio confirmado! Você é o morador nº {formatNumber(signatures)}.
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            Cada vizinho que você convida fortalece o abaixo-assinado perante os vereadores.
          </p>
          <a
            href={buildWhatsAppUrl(shareText)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-crimson-600 px-5 py-3 text-sm font-bold text-white shadow-crimson-btn transition-all hover:bg-crimson-700"
          >
            <MessageCircle className="h-4 w-4" />
            Compartilhar no WhatsApp
          </a>
        </div>
      )}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
        <ShieldCheck className="h-4 w-4 text-crimson-600" />
        Assinaturas verificadas por CEP • 100% livre de bots
      </p>
    </article>
  );
};
