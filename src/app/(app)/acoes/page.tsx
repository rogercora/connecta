'use client';

import React from 'react';
import { Hand, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AcoesPage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Ações Cívicas e Petições</h2>
        <p className="text-xs text-gray-500">
          Abaixo-assinados e consensos comunitários auditados no seu bairro.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
          <Hand className="w-4 h-4" />
          <span>Abaixo-Assinado em Andamento</span>
        </div>

        <h3 className="font-extrabold text-sm text-gray-900 leading-snug">
          Rejeição ao Aumento de Tráfego Comercial na Rua Silva Bueno
        </h3>

        <p className="text-xs text-gray-600">
          Originada do consenso de 142 votos de moradores do Ipiranga na pauta do Plano Diretor.
        </p>

        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-[78%]" />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
          <span>78 assinaturas auditadas</span>
          <span>Meta: 100 assinaturas</span>
        </div>

        <div className="pt-2 flex items-center space-x-2">
          <Button variant="primary" className="flex-1 rounded-xl text-xs py-2">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Assinar Digitalmente
          </Button>

          <Button variant="outline" className="rounded-xl text-xs py-2 px-3">
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center space-y-1">
        <p className="text-xs font-bold text-gray-700">Como funciona o consenso automático?</p>
        <p className="text-[11px] text-gray-500">
          Quando 50 ou mais moradores do mesmo CEP concordam ou discordam de uma pauta da Câmara, a IA gera automaticamente uma minuta jurídica para envio formal aos vereadores.
        </p>
      </div>
    </div>
  );
}

