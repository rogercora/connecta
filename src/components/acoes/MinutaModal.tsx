'use client';

import React, { useRef } from 'react';
import { X, Printer, Share2, ShieldCheck, Download, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface MinutaData {
  id: string;
  titulo: string;
  bairro: string;
  cidade: string;
  estado: string;
  totalAssinaturas: number;
  meta: number;
  tipoConsenso: 'concordar' | 'discordar' | 'comunitario';
  resumo: string;
  justificativas: string[];
  dataCriacao: string;
  protocoloReferencia?: string;
  vereadorAlvo?: string;
}

interface MinutaModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MinutaData | null;
}

export const MinutaModal: React.FC<MinutaModalProps> = ({ isOpen, onClose, data }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const shareText = `Veja a minuta do Abaixo-Assinado Oficial dos moradores de ${data.cidade}: "${data.titulo}". Já conta com ${data.totalAssinaturas} assinaturas auditadas pelo ConectaBr. Apoie e acompanhe: https://connectabrasil.vercel.app/acoes`;

  const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-zinc-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-crimson-50 text-crimson-600 flex items-center justify-center border border-crimson-200">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-950 leading-tight">
                Minuta Formal de Abaixo-Assinado Cívico
              </h3>
              <p className="text-[11px] text-zinc-500">
                Documento de peticionamento popular nos termos do Art. 5º, XXXIV da CF
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Document Preview */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-zinc-800 font-sans text-xs sm:text-sm leading-relaxed" id="printable-minuta">
          {/* Cabeçalho Oficial do Documento */}
          <div className="text-center pb-6 border-b-2 border-zinc-900 space-y-1">
            <p className="font-black text-xs uppercase tracking-widest text-crimson-700">
              REPÚBLICA FEDERATIVA DO BRASIL • ESTADO DE {data.estado}
            </p>
            <h1 className="font-black text-base sm:text-lg text-zinc-950 uppercase tracking-tight">
              MUNICÍPIO DE {data.cidade.toUpperCase()}
            </h1>
            <p className="text-xs text-zinc-600 font-semibold">
              MANIFESTAÇÃO E PETICIONAMENTO POPULAR DA COMUNIDADE — {data.bairro.toUpperCase()}
            </p>
            <div className="inline-flex items-center space-x-1.5 bg-zinc-100 text-zinc-800 text-[10px] font-mono px-3 py-1 rounded-full mt-2 border border-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-crimson-600" />
              <span>CERTIFICAÇÃO CONECTABR • PROTOCOLO DIGITAL #{data.protocoloReferencia || `CBR-${data.cidade.substring(0, 3).toUpperCase()}-2026`}</span>
            </div>
          </div>

          {/* Destinatário */}
          <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 text-xs space-y-1">
            <p className="font-bold text-zinc-900">
              À EXCELENTÍSSIMA MESA DIRETORA DA CÂMARA MUNICIPAL DE {data.cidade.toUpperCase()}
            </p>
            {data.vereadorAlvo && (
              <p className="text-zinc-600">
                Aos cuidados do(a) Ilustríssimo(a) Vereador(a) <strong>{data.vereadorAlvo}</strong>
              </p>
            )}
            <p className="text-zinc-500 text-[11px]">
              Assunto: Manifestação formal de {data.totalAssinaturas} cidadãos residentes quanto à matéria pública em pauta.
            </p>
          </div>

          {/* Preâmbulo Constitucional */}
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-950 uppercase text-xs tracking-wider text-crimson-700">
              I. DO DIREITO CONSTITUCIONAL DE PETIÇÃO
            </h4>
            <p className="text-justify text-zinc-700 leading-normal text-xs">
              Os cidadãos abaixo identificados e auditados, residentes e cadastrados com CEP validado no Município de {data.cidade} ({data.estado}), com fundamento no <strong>Artigo 5º, inciso XXXIV, alínea &apos;a&apos; da Constituição da República Federativa do Brasil</strong>, vêm mui respeitosamente perante este Poder Legislativo Municipal apresentar a presente manifestação cívica.
            </p>
          </div>

          {/* Objeto e Fatos */}
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-950 uppercase text-xs tracking-wider text-crimson-700">
              II. DO OBJETO E DOS FATOS APONTADOS PELA VIZINHANÇA
            </h4>
            <p className="text-justify text-zinc-800 font-medium leading-normal text-xs">
              A presente mobilização versa sobre: <strong>{data.titulo}</strong>.
            </p>
            <p className="text-justify text-zinc-700 leading-normal text-xs">
              {data.resumo}
            </p>
          </div>

          {/* Justificativas dos Moradores */}
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-950 uppercase text-xs tracking-wider text-crimson-700">
              III. DAS RAZÕES E PREOCUPAÇÕES COLETIVAS REGISTRADAS
            </h4>
            <ul className="space-y-1.5 pl-4 list-disc text-xs text-zinc-700">
              {data.justificativas.map((j, idx) => (
                <li key={idx} className="leading-snug">
                  {j}
                </li>
              ))}
            </ul>
          </div>

          {/* Dos Pedidos Formais */}
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-950 uppercase text-xs tracking-wider text-crimson-700">
              IV. DOS PEDIDOS
            </h4>
            <p className="text-xs text-zinc-700">
              Diante do exposto e da representatividade dos signatários verificados, requer-se:
            </p>
            <ol className="space-y-1.5 pl-5 list-decimal text-xs text-zinc-700 font-medium">
              <li>A juntada imediata deste documento aos autos da respectiva matéria em tramitação na Câmara Municipal;</li>
              <li>A realização de Audiência Pública com a convocação dos moradores do bairro {data.bairro};</li>
              <li>A readequação das diretrizes orçamentárias e urbanísticas nos moldes reivindicados pela comunidade.</li>
            </ol>
          </div>

          {/* Selo de Quórum e Assinaturas Auditadas */}
          <div className="pt-4 border-t border-zinc-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className="font-bold text-zinc-900">
                {data.cidade} - {data.estado}, {dataFormatada}.
              </span>
              <span className="text-crimson-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {data.totalAssinaturas} assinaturas auditadas por CEP
              </span>
            </div>

            <div className="p-3 bg-zinc-100 rounded-xl text-[11px] text-zinc-600 border border-zinc-200 space-y-1">
              <p className="font-bold text-zinc-800">🔒 Certificação Digital ConectaBr:</p>
              <p>
                Os signatários desta petição participaram por meio de conta autenticada única vinculada a CEP validado na plataforma ConectaBr. O registro de adesões encontra-se auditável no protocolo oficial desta petição.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer (Ações) */}
        <div className="p-4 border-t border-zinc-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1 sm:flex-none text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-1.5"
            >
              <Printer className="w-4 h-4 text-zinc-700" />
              <span>Imprimir / Salvar PDF</span>
            </Button>

            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none text-xs font-bold py-2.5 px-4 rounded-xl border border-zinc-300 text-zinc-800 hover:bg-zinc-50 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4 text-zinc-600" />
              <span>Compartilhar</span>
            </a>
          </div>

          <Button
            variant="primary"
            onClick={onClose}
            className="w-full sm:w-auto text-xs font-bold py-2.5 px-6 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson-btn"
          >
            Concluir Leitura
          </Button>
        </div>
      </div>
    </div>
  );
};

