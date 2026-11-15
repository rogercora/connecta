'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Users,
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
  { title: 'Faixa elevada e semáforo inteligente na Av. Andrômeda', supporters: 842 },
  { title: 'Reforma da praça e nova iluminação em LED', supporters: 318 },
  { title: 'Aumento de ônibus e linhas no horário de pico', supporters: 1204 },
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
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-civic-card sm:p-6 transition-all">
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">
          <MapPin className="h-3.5 w-3.5 text-crimson-600" />
          Acesso Geolocalizado por CEP
        </span>
        <span className="text-xs text-zinc-400">100% gratuito e seguro</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="hero-cep" className="sr-only">
          Seu CEP
        </label>
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
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
            className="h-14 w-full rounded-2xl border-2 border-zinc-200 bg-zinc-50/70 pl-12 pr-4 text-lg font-semibold tracking-wider text-zinc-950 placeholder:font-normal placeholder:text-zinc-400 transition-colors focus:border-crimson-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-crimson-600/15"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-crimson-600 px-7 text-base font-bold text-white shadow-crimson-btn transition-all hover:bg-crimson-700 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Participar do meu Bairro
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {error && (
        <p id="hero-cep-error" className="mt-2.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {/* Atalhos rápidos em pílulas */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="font-medium">Testar CEP:</span>
        <button
          type="button"
          onClick={() => quickFill('12230000')}
          className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 font-semibold text-zinc-700 transition-colors hover:border-crimson-300 hover:bg-crimson-50 hover:text-crimson-700 cursor-pointer"
        >
          📍 Jd. Satélite (SJC)
        </button>
        <button
          type="button"
          onClick={() => quickFill('12243000')}
          className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 font-semibold text-zinc-700 transition-colors hover:border-crimson-300 hover:bg-crimson-50 hover:text-crimson-700 cursor-pointer"
        >
          📍 Vila Ema (SJC)
        </button>
        <button
          type="button"
          onClick={() => quickFill('12308000')}
          className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 font-semibold text-zinc-700 transition-colors hover:border-crimson-300 hover:bg-crimson-50 hover:text-crimson-700 cursor-pointer"
        >
          📍 Jacareí
        </button>
      </div>

      {/* Estado desbloqueado (SJC) */}
      {result?.kind === 'unlocked' && (
        <div
          role="region"
          aria-label="Cidade desbloqueada"
          className="mt-5 rounded-2xl border-2 border-crimson-200 bg-crimson-50/70 p-5 transition-all animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-crimson-600 text-white shadow-crimson-btn">
              <BadgeCheck className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-crimson-200 px-2.5 py-0.5 text-xs font-bold text-crimson-900">
                  CIDADE LIBERADA
                </span>
                <span className="text-xs font-semibold text-crimson-800">Piloto Oficial Ativo</span>
              </div>
              <h3 className="mt-1 font-display text-lg font-extrabold text-zinc-950">
                Boa notícia! São José dos Campos já está ativa no ConectaBr.
              </h3>
              <p className="mt-1 text-sm text-zinc-700">
                Seu bairro ({result.bairro}) já tem causas e projetos de lei traduzidos aguardando sua voz.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-crimson-200/80 bg-white p-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Petições em alta na sua região:
            </p>
            <ul className="mt-2 divide-y divide-zinc-100 text-sm">
              {LOCAL_PETITIONS.map((p) => (
                <li key={p.title} className="flex items-center justify-between py-2 text-zinc-800">
                  <span className="truncate pr-3 font-medium">{p.title}</span>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700">
                    {formatNumber(p.supporters)} apoios
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/cadastro"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-crimson-600 px-5 py-3 text-sm font-bold text-white shadow-crimson-btn transition-all hover:bg-crimson-700"
            >
              <BadgeCheck className="h-4 w-4" />
              Criar Conta de Cidadão Verificado
            </Link>
            <a
              href="#processos"
              className="inline-flex items-center justify-center rounded-full border border-crimson-300 bg-white px-5 py-3 text-sm font-semibold text-crimson-900 hover:bg-crimson-50"
            >
              Ver Causas do Feed
            </a>
          </div>
        </div>
      )}

      {/* Estado em fila (outras cidades) */}
      {result?.kind === 'locked' && (
        <div
          role="region"
          aria-label="Cidade em fila de desbloqueio"
          className="mt-5 rounded-2xl border-2 border-crimson-200 bg-crimson-50/70 p-5 transition-all animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-crimson-600 text-white shadow-xs">
              <Users className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <span className="rounded-full bg-crimson-200 px-2.5 py-0.5 text-xs font-bold text-crimson-900">
                META COMUNITÁRIA DE DESBLOQUEIO
              </span>
              <h3 className="mt-1 font-display text-lg font-extrabold text-zinc-950">
                {result.city} ({result.uf}) está quase lá!
              </h3>
              <p className="mt-1 text-sm text-zinc-700">
                Liberamos a inteligência cívica assim que atingirmos a meta de moradores cadastrados na cidade.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
              <span>{formatNumber(result.current + (joined ? 1 : 0))} moradores mobilizados</span>
              <span>Meta: {formatNumber(result.goal)}</span>
            </div>
            <div
              className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-crimson-100"
              role="progressbar"
              aria-valuenow={result.current + (joined ? 1 : 0)}
              aria-valuemin={0}
              aria-valuemax={result.goal}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-crimson-500 to-crimson-600 transition-all duration-500"
                style={{
                  width: `${Math.min(100, ((result.current + (joined ? 1 : 0)) / result.goal) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Faltam apenas{' '}
              <strong className="text-zinc-900 font-bold">
                {Math.max(0, result.goal - (result.current + (joined ? 1 : 0)))}
              </strong>{' '}
              moradores para ativarmos o Diário Oficial de {result.city}.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            {!joined ? (
              <button
                type="button"
                onClick={() => setJoined(true)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-crimson-600 px-5 py-3 text-sm font-bold text-white shadow-crimson-btn transition-all hover:bg-crimson-700 cursor-pointer"
              >
                <Users className="h-4 w-4" />
                Entrar na Fila de Moradores
              </button>
            ) : (
              <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-crimson-600 px-5 py-3 text-sm font-bold text-white shadow-crimson-btn">
                <CheckCircle2 className="h-4 w-4" />
                Você está na fila de desbloqueio!
              </span>
            )}
            <a
              href={buildWhatsAppUrl(
                `Ajude a liberar o ConectaBr em ${result.city}! Moradores estão se unindo para fiscalizar a Câmara e criar abaixo-assinados reais. Acesse e apoie:`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-crimson-300 bg-white px-5 py-3 text-sm font-bold text-crimson-700 hover:bg-crimson-50"
            >
              <MessageCircle className="h-4 w-4 text-crimson-600" />
              Convidar no WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
