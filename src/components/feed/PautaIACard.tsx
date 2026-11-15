'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, FileText, Check, X, ChevronDown, Megaphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { PautaIA } from '@/types/database';
import { DiscordarModal } from '@/components/votacao/DiscordarModal';
import { useVoto } from '@/hooks/useVoto';

interface PautaIACardProps {
  pauta: PautaIA;
}

export const PautaIACard: React.FC<PautaIACardProps> = ({ pauta }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const {
    hasVoted,
    userVote,
    userMotivo,
    concordarCount,
    discordarCount,
    totalVotos,
    submitVote,
  } = useVoto(pauta.id, pauta.votos_concordar || 0, pauta.votos_discordar || 0);

  const handleConcordar = () => {
    submitVote('concordar');
  };

  const handleDiscordarSubmit = (motivo: string) => {
    submitVote('discordar', motivo);
  };

  const pctConcordar = totalVotos > 0 ? Math.round((concordarCount / totalVotos) * 100) : 50;
  const pctDiscordar = totalVotos > 0 ? 100 - pctConcordar : 50;
  const atingiuQuorum = discordarCount >= 50 || concordarCount >= 50;

  return (
    <>
      <article className="bg-white p-4 max-w-md mx-auto border-b-8 border-zinc-100 transition-colors">
        {/* Header do Card */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-crimson-50 border border-crimson-200/80 flex items-center justify-center text-crimson-600 shadow-2xs">
              <Megaphone className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-zinc-950 leading-tight">Decisão da Câmara</h4>
              <p className="text-[10px] text-zinc-400 font-semibold">Monitoramento oficial por CEP</p>
            </div>
          </div>
          <button className="text-zinc-400 hover:text-zinc-600 p-1" aria-label="Opções">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Título de Alerta */}
        <h3 className="font-extrabold text-[13.5px] sm:text-sm text-zinc-950 mb-2.5 tracking-tight leading-snug">
          {pauta.titulo}
        </h3>

        {/* Bloco de Resumo Inteligente com borda arredondada */}
        <div className="border border-zinc-200 rounded-2xl p-3.5 bg-zinc-50/50 mb-3 text-xs leading-relaxed text-zinc-800 shadow-2xs">
          <div className="flex items-start space-x-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-crimson-600 shrink-0 mt-0.5" />
            <p className="text-xs">
              <strong className="font-black text-crimson-600">RESUMO INTELIGENTE: </strong>
              <span className="font-medium text-zinc-900">{pauta.resumo_ia}</span>
            </p>
          </div>

          <div className="space-y-1 mt-2 text-[11px] text-zinc-700 border-t border-zinc-200/60 pt-2">
            <p>
              <strong className="font-bold text-zinc-950">Impacto na rua: </strong>
              <span>{pauta.impacto_bairro}</span>
            </p>
            <p>
              <strong className="font-bold text-zinc-950">Vereador proponente: </strong>
              <span>{pauta.vereador_proponente}.</span>
            </p>
          </div>
        </div>

        {/* Botões de Ação Cívica */}
        <div className="grid grid-cols-2 gap-2.5 mb-2">
          <button
            onClick={handleConcordar}
            disabled={hasVoted}
            className={`flex items-center justify-center space-x-1.5 py-3 px-3 rounded-full font-black text-xs transition-all shadow-crimson-btn cursor-pointer ${
              userVote === 'concordar'
                ? 'bg-crimson-800 text-white ring-2 ring-crimson-500'
                : 'bg-crimson-600 hover:bg-crimson-700 text-white active:scale-95'
            } ${hasVoted && userVote !== 'concordar' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span className="tracking-wide">CONCORDAR</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            disabled={hasVoted}
            className={`flex items-center justify-center space-x-1.5 py-3 px-3 rounded-full font-black text-xs transition-all shadow-sm cursor-pointer ${
              userVote === 'discordar'
                ? 'bg-zinc-800 text-white ring-2 ring-zinc-500'
                : 'bg-zinc-950 hover:bg-zinc-800 text-white active:scale-95'
            } ${hasVoted && userVote !== 'discordar' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span className="tracking-wide">DISCORDAR</span>
          </button>
        </div>

        {/* Legenda de Consenso */}
        <p className="text-[10.5px] text-zinc-500 text-center mb-3 font-medium">
          Seu voto ajuda a gerar uma petição oficial de pressão na Câmara.
        </p>

        {/* Placar Cívico em Tempo Real (ativado após o voto) */}
        {hasVoted && (
          <div className="mb-3.5 p-3.5 bg-zinc-50 border border-zinc-200/90 rounded-2xl space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-crimson-600">
                <CheckCircle2 className="w-4 h-4" />
                Você votou {userVote === 'concordar' ? 'a favor' : 'contra'}
              </span>
              <span className="text-zinc-500 font-semibold">{totalVotos} cidadãos participaram</span>
            </div>

            {userMotivo && (
              <p className="text-[11px] text-zinc-600 bg-white p-2 rounded-xl border border-zinc-200/70 italic">
                &ldquo;{userMotivo}&rdquo;
              </p>
            )}

            {/* Barra de Consenso da Comunidade */}
            <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-crimson-600 h-full transition-all duration-700"
                style={{ width: `${pctConcordar}%` }}
              />
              <div
                className="bg-zinc-800 h-full transition-all duration-700"
                style={{ width: `${pctDiscordar}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-crimson-700">{pctConcordar}% concordam ({concordarCount})</span>
              <span className="text-zinc-800">{pctDiscordar}% discordam ({discordarCount})</span>
            </div>

            {atingiuQuorum && (
              <div className="mt-1 pt-1.5 border-t border-zinc-200 flex items-center justify-between text-[11px] font-bold text-crimson-800">
                <span>🚨 Quórum cívico atingido! Abaixo-assinado gerado.</span>
                <Link href="/acoes" className="underline hover:text-crimson-900">
                  Ver em Ações →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Ver Diário Oficial Original */}
        <div className="flex items-center space-x-2 pt-0.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 border border-zinc-200 shrink-0">
            <FileText className="w-4 h-4 stroke-[2]" />
          </div>

          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex-1 flex items-center justify-between border border-zinc-300 rounded-full py-2 px-4 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <span>Ver Diário Oficial Original</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showOriginal ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Diário Oficial Expandido (se clicado) */}
        {showOriginal && (
          <div className="mt-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-[11px] text-zinc-600 space-y-1">
            <p className="font-bold text-zinc-950">
              {pauta.fonte_diario || 'Diário Oficial Eletrônico do Município'}
            </p>
            <p className="font-mono text-[10px] line-clamp-3 text-zinc-600">
              PROJETO DE LEI Nº 512/2026 - Dispõe sobre a readequação das diretrizes urbanísticas dos lotes situados na Rua Silva Bueno...
            </p>
            <a
              href={pauta.link_pdf_original || '#'}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-crimson-600 font-bold hover:underline pt-1"
            >
              Abrir PDF original completo →
            </a>
          </div>
        )}
      </article>

      <DiscordarModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleDiscordarSubmit}
      />
    </>
  );
};
