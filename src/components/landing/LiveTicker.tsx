'use client';

import React, { useEffect, useState } from 'react';
import { formatNumber } from './shared';

const EVENTS = [
  { name: 'Mariana S.', place: 'Jardim Satélite, SJC', action: 'acabou de assinar a petição da Av. Andrômeda', seconds: 12 },
  { name: 'Carlos R.', place: 'Vila Ema, SJC', action: 'votou contra a nova taxa da Câmara', seconds: 8 },
  { name: 'Fernanda L.', place: 'Centro, Jacareí', action: 'convidou 6 vizinhos pelo WhatsApp', seconds: 21 },
  { name: 'João P.', place: 'Urbanova, SJC', action: 'iniciou um abaixo-assinado sobre iluminação pública', seconds: 5 },
  { name: 'Patrícia M.', place: 'Jardim das Nações, Taubaté', action: 'entrou na mobilização para liberar a cidade', seconds: 17 },
  { name: 'Ricardo A.', place: 'Bosque dos Eucaliptos, SJC', action: 'apoiou a cobrança de asfalto na rua', seconds: 9 },
  { name: 'Luana T.', place: 'Mooca, São Paulo', action: 'assinou a causa por creches no bairro', seconds: 14 },
];

const ROTATION_MS = 4000;

export const LiveTicker: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [total, setTotal] = useState(14892);

  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setVisible(false);
      fadeTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % EVENTS.length);
        setTotal((t) => t + 1 + Math.floor(Math.random() * 3));
        setVisible(true);
      }, 300);
    }, ROTATION_MS);

    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, []);

  const event = EVENTS[index];

  return (
    <div className="border-b border-[#E8DFD0] bg-[#F5EFE6] text-earth-700">
      <div
        className="mx-auto flex h-10 max-w-7xl items-center gap-3 overflow-hidden px-4 text-xs sm:px-6 sm:text-[13px] lg:px-8"
        role="status"
        aria-live="polite"
      >
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-sage-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
          </span>
          Ao vivo
        </span>

        <p className="min-w-0 truncate text-earth-800">
          <strong className="font-extrabold text-earth-900 tabular-nums">
            {formatNumber(total)} cidadãos
          </strong>{' '}
          <span className="hidden sm:inline">já estão mobilizados na plataforma</span>
          <span className="mx-2 text-earth-300">•</span>
          <span
            className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
          >
            <strong className="font-bold text-earth-900">{event.name}</strong>{' '}
            <span className="text-earth-600">({event.place})</span> {event.action}{' '}
            <span className="text-earth-500">há {event.seconds}s.</span>
          </span>
        </p>
      </div>
    </div>
  );
};
