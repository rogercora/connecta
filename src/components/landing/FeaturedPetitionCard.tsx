'use client';

import React, { useState } from 'react';
import { CheckCircle2, Flame, MessageCircle, PenLine, ShieldCheck, HeartHandshake } from 'lucide-react';
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
    <article className="relative rounded-3xl border border-[#EAE3D6] bg-white p-6 shadow-hoperise-card sm:p-8 transition-all hover:shadow-hoperise-hover">
      {/* Badge estilo HopeRise */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-100 px-3.5 py-1 text-xs font-bold text-terracotta-800">
          <Flame className="h-3.5 w-3.5 text-terracotta-600" />
          Causa Urgente • Jardim Satélite (SJC)
        </span>
        <span className="text-xs font-semibold text-earth-500">Protocolo em 4 dias</span>
      </div>

      <h2 className="mt-4 font-display text-xl font-extrabold leading-snug text-earth-900 sm:text-2xl">
        Instalação de faixa elevada e semáforo inteligente na Av. Andrômeda
      </h2>

      {/* Relato humano com citação acolhedora */}
      <blockquote className="mt-3.5 rounded-2xl border-l-4 border-terracotta-500 bg-cream-50/70 p-3.5 text-sm leading-relaxed text-earth-800">
        “Mais de 400 crianças atravessam aqui todos os dias sem sinalização adequada. Vamos protocolar este pedido na Secretaria de Mobilidade.”
        <footer className="mt-1.5 text-xs font-semibold text-earth-500">
          — Ana L., mãe e moradora há 11 anos
        </footer>
      </blockquote>

      {/* Termômetro de meta no estilo HopeRise */}
      <div className="mt-6">
        <div className="flex items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-earth-500">Progresso da meta</span>
            <p className="mt-0.5 text-sm text-earth-700">
              <strong
                key={signatures}
                className="font-display text-2xl font-extrabold text-earth-900 tabular-nums animate-[pulse_0.6s_ease-out_1]"
              >
                {formatNumber(signatures)}
              </strong>{' '}
              de {formatNumber(GOAL)} assinaturas
            </p>
          </div>
          <span className="rounded-full bg-cream-200 px-3 py-1 font-display text-sm font-extrabold text-terracotta-700 tabular-nums">
            {Math.round(pct)}%
          </span>
        </div>

        <div
          className="mt-2.5 h-3.5 w-full overflow-hidden rounded-full bg-cream-200"
          role="progressbar"
          aria-valuenow={signatures}
          aria-valuemin={0}
          aria-valuemax={GOAL}
          aria-label="Assinaturas da petição"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-terracotta-400 to-terracotta-500 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-earth-500">
          Faltam apenas <strong className="font-semibold text-earth-800">{GOAL - signatures}</strong> assinaturas de moradores para o protocolo oficial.
        </p>
      </div>

      {/* Assinantes recentes com avatares circulares */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex -space-x-2">
          {(signed ? ['VC', ...RECENT_SIGNERS.slice(0, 4)] : RECENT_SIGNERS).map((initials, i) => (
            <span
              key={`${initials}-${i}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold shadow-xs ${
                initials === 'VC'
                  ? 'bg-sage-600 text-white'
                  : 'bg-cream-300 text-earth-800'
              }`}
            >
              {initials}
            </span>
          ))}
        </div>
        <p className="text-xs text-earth-600">
          {signed ? 'Você e mais 47 vizinhos apoiaram hoje' : '47 vizinhos apoiaram esta causa hoje'}
        </p>
      </div>

      {/* Botão de ação estilo HopeRise */}
      {!signed ? (
        <button
          type="button"
          onClick={() => setSigned(true)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-terracotta-500 px-6 py-4 text-base font-bold text-white shadow-hoperise-btn transition-all hover:bg-terracotta-600 active:scale-[0.98] cursor-pointer"
        >
          <PenLine className="h-5 w-5" />
          Apoiar esta Causa com 1 Clique
        </button>
      ) : (
        <div className="mt-6 rounded-2xl border-2 border-sage-300 bg-sage-50/70 p-4 transition-all" role="status">
          <p className="flex items-center gap-2 font-display text-base font-extrabold text-sage-800">
            <CheckCircle2 className="h-5 w-5 text-sage-600" />
            Apoio confirmado! Você é o morador nº {formatNumber(signatures)}.
          </p>
          <p className="mt-1 text-sm text-earth-700">
            Cada vizinho que você convida fortalece o abaixo-assinado perante os vereadores.
          </p>
          <a
            href={buildWhatsAppUrl(shareText)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sage-700 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-sage-800"
          >
            <MessageCircle className="h-4 w-4" />
            Compartilhar no WhatsApp
          </a>
        </div>
      )}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-earth-500">
        <ShieldCheck className="h-4 w-4 text-sage-600" />
        Assinaturas verificadas por CEP • 100% livre de bots
      </p>
    </article>
  );
};
