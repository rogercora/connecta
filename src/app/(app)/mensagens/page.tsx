'use client';

import React from 'react';
import { MessageSquare, Users, ShieldCheck } from 'lucide-react';

export default function MensagensPage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Mensagens & Gabinetes</h2>
        <p className="text-xs text-gray-500">
          Canais diretos com vereadores e lideranças do seu bairro.
        </p>
      </div>

      <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3.5 flex items-center space-x-3 hover:bg-gray-50 cursor-pointer">
          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            CS
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 truncate">
                Gabinete Vereador Carlos Silva
              </h4>
              <span className="text-[10px] text-gray-400">14:20</span>
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              Recebemos as observações dos moradores sobre a Rua Silva Bueno...
            </p>
          </div>
        </div>

        <div className="p-3.5 flex items-center space-x-3 hover:bg-gray-50 cursor-pointer">
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            156
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 truncate">
                Zeladoria Municipal - Protocolo #12345
              </h4>
              <span className="text-[10px] text-gray-400">Ontem</span>
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              Vistoria agendada para a Rua Agostinho Gomes em até 48h.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

