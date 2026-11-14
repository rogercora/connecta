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
    'Acabei de assinar: "Faixa elevada e semáforo inteligente na Av. Andrômeda". Mais de 400 crianças atravessam ali todo dia. Assina também, leva 1 clique:';

  return (
    <article className="relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(24,24,27,0.25)] sm:p-7">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-800">
        <Flame className="h-3.5 w-3.5" />
        Em alta no Jardim Satélite • SJC
      </span>

      <h2 className="mt-4 font-display text-xl font-extrabold leading-snug text-zinc-900 sm:text-2xl">
        Instalação de faixa elevada e semáforo inteligente na Av. Andrômeda
      </h2>

      <blockquote className="mt-3 border-l-4 border-sky-600 pl-4 text-[15px] leading-relaxed text-zinc-700">
        “Mais de 400 crianças atravessam aqui todos os dias sem sinalização adequada. Vamos protocolar este pedido na Secretaria de Mobilidade.”
        <footer className="mt-1.5 text-xs font-semibold text-zinc-500">
          — Ana L., mãe e moradora há 11 anos
        </footer>
      </blockquote>

      {/* Termômetro de meta */}
      <div className="mt-6">
        <div className="flex items-end justify-between gap-2">
          <p className="text-sm text-zinc-700">
            <strong
              key={signatures}
              className="font-display text-2xl font-extrabold text-zinc-900 tabular-nums animate-[pulse_0.6s_ease-out_1]"
            >
              {formatNumber(signatures)}
            </strong>{' '}
            de {formatNumber(GOAL)} assinaturas verificadas
          </p>
          <span className="text-sm font-bold text-orange-700 tabular-nums">{Math.round(pct)}%</span>
        </div>
        <div
          className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-orange-100"
          role="progressbar"
          aria-valuenow={signatures}
          aria-valuemin={0}
          aria-valuemax={GOAL}
          aria-label="Assinaturas da petição"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Faltam <strong className="text-zinc-800">{GOAL - signatures}</strong> assinaturas para o protocolo oficial.
        </p>
      </div>

      {/* Assinantes recentes */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex -space-x-2">
          {(signed ? ['VC', ...RECENT_SIGNERS.slice(0, 4)] : RECENT_SIGNERS).map((initials, i) => (
            <span
              key={`${initials}-${i}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold ${
                initials === 'VC' ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-700'
              }`}
            >
              {initials}
            </span>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          {signed ? 'Você e mais 47 vizinhos assinaram hoje' : '47 vizinhos assinaram hoje'}
        </p>
      </div>

      {!signed ? (
        <button
          type="button"
          onClick={() => setSigned(true)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-4 text-base font-bold text-white shadow-md shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98]"
        >
          <PenLine className="h-5 w-5" />
          Assinar esta Petição (1 Clique)
        </button>
      ) : (
        <div className="mt-6 rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4" role="status">
          <p className="flex items-center gap-2 font-display text-base font-extrabold text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
            Assinatura registrada! Você é o nº {formatNumber(signatures)}.
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            Cada vizinho que você convida aproxima o protocolo na Secretaria.
          </p>
          <a
            href={buildWhatsAppUrl(shareText)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
          >
            <MessageCircle className="h-4 w-4" />
            Compartilhar no WhatsApp
          </a>
        </div>
      )}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        1 CPF = 1 assinatura • Moradores verificados por CEP
      </p>
    </article>
  );
};

