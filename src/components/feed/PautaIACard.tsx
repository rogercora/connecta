'use client';

import React, { useState } from 'react';
import { Store, MoreHorizontal, FileText, Check, X, ChevronDown } from 'lucide-react';
import { PautaIA } from '@/types/database';
import { DiscordarModal } from '@/components/votacao/DiscordarModal';
import { useVoto } from '@/hooks/useVoto';

interface PautaIACardProps {
  pauta: PautaIA;
}

export const PautaIACard: React.FC<PautaIACardProps> = ({ pauta }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const { hasVoted, userVote, submitVote } = useVoto(pauta.id);

  const handleConcordar = () => {
    submitVote('concordar');
  };

  const handleDiscordarSubmit = (motivo: string) => {
    submitVote('discordar', motivo);
  };

  return (
    <>
      <article className="bg-white p-4 max-w-md mx-auto border-b-8 border-gray-100">
        {/* Header do Card */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-[#dff7ee] flex items-center justify-center text-[#0d9488]">
              <Store className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 leading-tight">Meu Bairro</h4>
              <p className="text-[10px] text-gray-400 font-medium">CEP a CEP - local</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 p-1" aria-label="Opções">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Título de Alerta */}
        <h3 className="font-extrabold text-[13px] sm:text-sm text-gray-900 mb-2 tracking-tight">
          {pauta.titulo}
        </h3>

        {/* Bloco de Resumo Inteligente com borda arredondada */}
        <div className="border border-gray-200/90 rounded-2xl p-3.5 bg-white mb-3 text-xs leading-relaxed text-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start space-x-1.5 mb-2">
            <span className="text-base leading-none select-none">🤖</span>
            <p className="text-xs">
              <strong className="font-black text-[#1ea751]">RESUMO INTELIGENTE: </strong>
              <span className="font-medium text-gray-900">{pauta.resumo_ia}</span>
            </p>
          </div>

          <div className="space-y-1 mt-2 text-[11px] text-gray-700">
            <p>
              <strong className="font-bold text-gray-900">Impacto: </strong>
              <span>{pauta.impacto_bairro}</span>
            </p>
            <p>
              <strong className="font-bold text-gray-900">Vereador proponente: </strong>
              <span>{pauta.vereador_proponente}.</span>
            </p>
          </div>
        </div>

        {/* Botões de Ação Cívica */}
        <div className="grid grid-cols-2 gap-2.5 mb-2">
          <button
            onClick={handleConcordar}
            disabled={hasVoted}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-full font-black text-xs transition-all shadow-sm ${
              userVote === 'concordar'
                ? 'bg-emerald-700 text-white ring-2 ring-emerald-500'
                : 'bg-[#1ea751] hover:bg-[#168a42] text-white active:scale-95'
            } ${hasVoted && userVote !== 'concordar' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span className="tracking-wide">CONCORDAR</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            disabled={hasVoted}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-full font-black text-xs transition-all shadow-sm ${
              userVote === 'discordar'
                ? 'bg-red-800 text-white ring-2 ring-red-500'
                : 'bg-[#2b2f32] hover:bg-[#1f2224] text-white active:scale-95'
            } ${hasVoted && userVote !== 'discordar' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span className="tracking-wide">DISCORDAR</span>
          </button>
        </div>

        {/* Legenda de Consenso */}
        <p className="text-[10px] text-gray-500 text-center mb-3 font-medium">
          Seu voto ajuda a gerar uma petição automática de consenso.
        </p>

        {/* Ver Diário Oficial Original */}
        <div className="flex items-center space-x-2 pt-0.5">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 border border-gray-200/80 shrink-0">
            <FileText className="w-4 h-4 stroke-[2]" />
          </div>

          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex-1 flex items-center justify-between border border-gray-300 rounded-full py-2 px-4 text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <span>Ver Diário Oficial Original</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showOriginal ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Diário Oficial Expandido (se clicado) */}
        {showOriginal && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
            <p className="font-bold text-gray-900">
              {pauta.fonte_diario || 'Diário Oficial Eletrônico do Município'}
            </p>
            <p className="font-mono text-[10px] line-clamp-3 text-gray-600">
              PROJETO DE LEI Nº 512/2026 - Dispõe sobre a readequação das diretrizes urbanísticas dos lotes situados na Rua Silva Bueno...
            </p>
            <a
              href={pauta.link_pdf_original || '#'}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-emerald-600 font-bold hover:underline pt-1"
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
