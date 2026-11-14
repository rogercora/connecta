'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Loader2,
  MapPin,
  MessageCircle,
  Users,
  Lock,
} from 'lucide-react';
import { formatCEP } from '@/lib/utils/formatters';
import { useGeolocation } from '@/hooks/useGeolocation';
import { CITY_GOALS, buildWhatsAppUrl, formatNumber, normalizeCity } from './shared';

interface CepParticipationProps {
  cepInputRef: React.RefObject<HTMLInputElement | null>;
}

type Result =
  | { kind: 'unlocked'; cep: string; bairro: string }
  | { kind: 'locked'; cep: string; city: string; uf: string; current: number; goal: number };

const LOCAL_PETITIONS = [
  { title: 'Faixa elevada e semáforo na Av. Andrômeda', supporters: 842 },
  { title: 'Reforma da praça e iluminação em LED', supporters: 318 },
  { title: 'Mais linhas de ônibus no horário de pico', supporters: 1204 },
];

export const CepParticipation: React.FC<CepParticipationProps> = ({ cepInputRef }) => {
  const { buscarCEP, loading } = useGeolocation();
  const [cep, setCep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [joined, setJoined] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCEP(e.target.value));
    if (error) setError('');
  };

  const evaluate = async (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 8) {
      setError('Digite os 8 números do seu CEP.');
      setResult(null);
      return;
    }

    setError('');
    setJoined(false);
    const endereco = await buscarCEP(digits);

    if (digits.startsWith('122')) {
      setResult({ kind: 'unlocked', cep: digits, bairro: endereco?.bairro || 'Seu bairro' });
      return;
    }

    const city = endereco?.localidade || 'Sua cidade';
    const uf = endereco?.uf || '';
    const known = CITY_GOALS.find((c) => !c.active && normalizeCity(c.name) === normalizeCity(city));
    const current = known ? known.current : 90 + (parseInt(digits.slice(0, 5), 10) % 170);
    const goal = known ? known.goal : 300;

    setResult({ kind: 'locked', cep: digits, city, uf, current, goal });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void evaluate(cep);
  };

  const quickFill = (sample: string) => {
    const formatted = formatCEP(sample);
    setCep(formatted);
    void evaluate(formatted);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="hero-cep" className="sr-only">
          Seu CEP
        </label>
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            id="hero-cep"
            ref={cepInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={9}
            value={cep}
            onChange={handleChange}
            placeholder="00000-000"
            aria-invalid={!!error}
            aria-describedby={error ? 'hero-cep-error' : undefined}
            className="h-[52px] w-full rounded-xl border-2 border-zinc-300 bg-white pl-11 pr-4 text-lg font-semibold tracking-wider text-zinc-900 placeholder:font-normal placeholder:text-zinc-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-600/15"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 text-base font-bold text-white shadow-sm shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Participar do meu Bairro
        </button>
      </form>

      {error && (
        <p id="hero-cep-error" className="mt-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>Simular:</span>
        <button
          type="button"
          onClick={() => quickFill('12230000')}
          className="rounded-md border border-zinc-200 bg-[#F4F5F7] px-2.5 py-1 font-medium text-zinc-700 hover:border-emerald-500 hover:text-emerald-700"
        >
          CEP de SJC
        </button>
        <button
          type="button"
          onClick={() => quickFill('12308000')}
          className="rounded-md border border-zinc-200 bg-[#F4F5F7] px-2.5 py-1 font-medium text-zinc-700 hover:border-orange-500 hover:text-orange-700"
        >
          CEP de Jacareí
        </button>
      </div>

      {result?.kind === 'unlocked' && (
        <div className="mt-4 overflow-hidden rounded-xl border-2 border-emerald-500 bg-emerald-50/60">
          <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-3">
            <BadgeCheck className="h-6 w-6 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Bairro desbloqueado
              </p>
              <p className="truncate font-display text-base font-extrabold text-zinc-900">
                {result.bairro} • São José dos Campos
              </p>
            </div>
          </div>
          <ul className="divide-y divide-emerald-100 bg-white">
            {LOCAL_PETITIONS.map((p) => (
              <li key={p.title} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 truncate font-medium text-zinc-800">{p.title}</span>
                <span className="shrink-0 text-xs font-bold text-orange-700 tabular-nums">
                  {formatNumber(p.supporters)} apoios
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 p-4 sm:flex-row">
            <Link
              href={`/cadastro?cep=${result.cep}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Criar conta verificada
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-400"
            >
              Ver pautas do bairro
            </Link>
          </div>
        </div>
      )}

      {result?.kind === 'locked' && (() => {
        const current = result.current + (joined ? 1 : 0);
        const missing = Math.max(result.goal - current, 0);
        const pct = Math.min(100, Math.floor((current / result.goal) * 100));
        const cityLabel = result.uf ? `${result.city} (${result.uf})` : result.city;
        const shareText = `Estou ajudando a liberar o Connecta Brasil em ${result.city}! Faltam só ${missing} moradores para a gente ter abaixo-assinados verificados e as leis da Câmara traduzidas pro nosso bairro. Entra com seu CEP:`;

        return (
          <div className="mt-4 rounded-xl border-2 border-orange-500 bg-orange-50/50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                <Lock className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
                  Desbloqueio da cidade
                </p>
                <p className="font-display text-base font-extrabold text-zinc-900 sm:text-lg">
                  Faltam {missing} moradores para liberar {cityLabel}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div
                className="h-3 w-full overflow-hidden rounded-full bg-orange-100"
                role="progressbar"
                aria-valuenow={current}
                aria-valuemin={0}
                aria-valuemax={result.goal}
                aria-label="Moradores na fila"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs font-semibold text-zinc-600">
                <span className="tabular-nums">
                  {current} / {result.goal} moradores
                </span>
                <span className="text-orange-700">{pct}%</span>
              </div>
            </div>

            <a
              href={buildWhatsAppUrl(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-emerald-800"
            >
              <MessageCircle className="h-5 w-5" />
              Convidar vizinhos no WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setJoined(true)}
              disabled={joined}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-400 disabled:border-emerald-300 disabled:bg-emerald-50 disabled:text-emerald-800"
            >
              {joined ? (
                <>
                  <BadgeCheck className="h-4 w-4" /> Você está na fila (#{current})
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" /> Garantir meu lugar na fila
                </>
              )}
            </button>
          </div>
        );
      })()}
    </div>
  );
};
