'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  FileText,
  Check,
  X,
  ChevronDown,
  Megaphone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PautaIA } from '@/types/database';
import { DiscordarModal } from '@/components/votacao/DiscordarModal';
import { useVoto } from '@/hooks/useVoto';

interface PautaIACardProps {
  pauta: PautaIA;
  cidadeQuorum?: number;
}

function getSafeHref(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export const PautaIACard: React.FC<PautaIACardProps> = ({ pauta, cidadeQuorum }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const {
    hasVoted,
    userVote,
    userMotivo,
    concordarCount,
    discordarCount,
    totalVotos,
    isSubmitting,
    voteError,
    isAuthenticated,
    submitVote,
  } = useVoto(pauta.id, pauta.votos_concordar || 0, pauta.votos_discordar || 0);

  const handleConcordar = () => {
    void submitVote('concordar');
  };

  const handleDiscordarSubmit = (motivo: string) => {
    void submitVote('discordar', motivo);
  };

  const metaQuorum = pauta.quorum_meta ?? cidadeQuorum ?? 50;
  const pctConcordar = totalVotos > 0 ? Math.round((concordarCount / totalVotos) * 100) : 50;
  const pctDiscordar = totalVotos > 0 ? 100 - pctConcordar : 50;
  const atingiuQuorum = discordarCount >= metaQuorum || pauta.status === 'peticao_gerada';
  const safePdfUrl = getSafeHref(pauta.link_pdf_original);

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

        {/* Bloco de Resumo Inteligente */}
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
            disabled={hasVoted || isSubmitting}
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
            disabled={hasVoted || isSubmitting}
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

        {/* Mensagem de erro/permissão no voto */}
        {voteError && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{voteError}</span>
            </div>
            {!isAuthenticated && (
              <Link href="/login?next=/acoes" className="font-bold text-crimson-700 underline shrink-0">
                Entrar
              </Link>
            )}
          </div>
        )}

        {/* Legenda de Consenso */}
        <p className="text-[10.5px] text-zinc-500 text-center mb-3 font-medium">
          Concordar registra apoio à pauta. Discordar soma adesão para gerar petição oficial ao atingir {metaQuorum} votos.
        </p>

        {/* Placar Cívico em Tempo Real */}
        {hasVoted && (
          <div className="mb-3.5 p-3.5 bg-zinc-50 border border-zinc-200/90 rounded-2xl space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-crimson-600">
                <CheckCircle2 className="w-4 h-4" />
                Você votou {userVote === 'concordar' ? 'a favor (Apoio)' : 'contra (Assinatura de Pressão)'}
              </span>
              <span className="text-zinc-500 font-semibold">{totalVotos} cidadãos votaram</span>
            </div>

            {userMotivo && (
              <p className="text-[11px] text-zinc-600 bg-white p-2 rounded-xl border border-zinc-200/70 italic">
                Motivo da discordância: &ldquo;{userMotivo}&rdquo;
              </p>
            )}

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
              <span className="text-zinc-800">{pctDiscordar}% discordam ({discordarCount}/{metaQuorum})</span>
            </div>

            {atingiuQuorum ? (
              <div className="mt-1 pt-2 border-t border-zinc-200 text-[11px] font-bold text-crimson-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span>🚨 Quórum atingido ({metaQuorum}+ discordâncias)!</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px]">
                    {pauta.status === 'peticao_gerada' ? 'Petição criada' : 'Em revisão no Admin'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-normal">
                  A IA gerou a minuta formal a partir dos argumentos dos moradores. Assim que aprovada pelo administrador, será publicada na aba de Petições para protocolo oficial.
                </p>
              </div>
            ) : (
              <div className="mt-1 pt-1.5 border-t border-zinc-200 text-[10.5px] text-zinc-500 flex justify-between">
                <span>Faltam {Math.max(0, metaQuorum - discordarCount)} discordâncias para virar petição oficial</span>
                <span className="font-semibold text-zinc-700">Meta: {metaQuorum}</span>
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

        {showOriginal && (
          <div className="mt-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-[11px] text-zinc-600 space-y-1">
            <p className="font-bold text-zinc-950">
              {pauta.fonte_diario || 'Diário Oficial Eletrônico do Município'}
            </p>
            {safePdfUrl ? (
              <a
                href={safePdfUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-block text-crimson-600 font-bold hover:underline pt-1"
              >
                Abrir PDF original completo →
              </a>
            ) : (
              <span className="inline-block text-zinc-400 pt-1">Link oficial indisponível.</span>
            )}
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
