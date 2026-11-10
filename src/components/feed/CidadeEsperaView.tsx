'use client';

import React, { useState } from 'react';
import { Share2, Users, CheckCircle2, ArrowRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CidadeStatusData {
  cidade: string;
  estado: string;
  codigo_ibge?: string;
  status: 'ativa' | 'em_espera' | 'em_breve';
  is_liberada: boolean;
  total_cadastrados: number;
  meta_usuarios: number;
  faltam: number;
  porcentagem: number;
}

interface CidadeEsperaViewProps {
  cidadeStatus: CidadeStatusData;
  onExplorarFederal?: () => void;
}

export const CidadeEsperaView: React.FC<CidadeEsperaViewProps> = ({
  cidadeStatus,
  onExplorarFederal,
}) => {
  const [copied, setCopied] = useState(false);

  const shareText = `Vizinhos de ${cidadeStatus.cidade}! O Conecta está prestes a ser liberado na nossa cidade para acompanharmos pautas da Câmara com IA e cobrarmos zeladoria urbana com protocolo. Faltam poucas pessoas para bater a meta! Cadastre-se pelo link para liberar: https://connecta-swart-pi.vercel.app/cadastro`;

  const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://connecta-swart-pi.vercel.app/cadastro');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      {/* Card Principal de Espera */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-5 shadow-sm text-center space-y-4">
        {/* Badge de Status */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="text-sm">🚀</span>
          <span>Desbloqueio Comunitário</span>
        </div>

        {/* Título */}
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
            O Conecta está quase chegando em{' '}
            <span className="text-emerald-600 block">
              {cidadeStatus.cidade} - {cidadeStatus.estado}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            Liberamos a plataforma com Diário Oficial e protocolos de zeladoria assim que a cidade atinge a meta de moradores.
          </p>
        </div>

        {/* Barra de Progresso */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700">
            <span className="flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>{cidadeStatus.total_cadastrados} cadastrados</span>
            </span>
            <span className="text-emerald-700">{cidadeStatus.porcentagem}%</span>
          </div>

          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(6, cidadeStatus.porcentagem)}%` }}
            />
          </div>

          <p className="text-[11px] text-gray-500 font-medium">
            Meta: <strong>{cidadeStatus.meta_usuarios} cidadãos</strong> (faltam{' '}
            <strong className="text-emerald-700">{cidadeStatus.faltam}</strong>)
          </p>
        </div>

        {/* Botão de Ação: Compartilhar no WhatsApp */}
        <div className="space-y-2 pt-1">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 w-full py-3.5 px-4 rounded-2xl font-black text-xs text-white bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 shadow-md shadow-emerald-500/10 transition-all"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>Convidar Vizinhos no WhatsApp</span>
          </a>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center space-x-1.5 w-full py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Link copiado para a área de transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copiar Link de Convite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dica para explorar pautas federais */}
      {onExplorarFederal && (
        <div
          onClick={onExplorarFederal}
          className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-emerald-100/70 transition-colors group"
        >
          <div className="space-y-0.5 pr-2">
            <p className="text-xs font-bold text-emerald-950">
              Quer ver a IA em ação agora?
            </p>
            <p className="text-[11px] text-emerald-800">
              Acesse a aba <strong>Brasil Federal</strong> para votar em pautas de lei nacionais.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      )}
    </div>
  );
};

