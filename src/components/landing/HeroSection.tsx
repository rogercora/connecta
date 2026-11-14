'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  AlertTriangle,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { formatCEP } from '@/lib/utils/formatters';

interface HeroSectionProps {
  cepInputRef: React.RefObject<HTMLInputElement | null>;
}

type CepResult =
  | { status: 'idle' }
  | { status: 'unlocked'; cep: string }
  | { status: 'waitlist'; cep: string };

export const HeroSection: React.FC<HeroSectionProps> = ({ cepInputRef }) => {
  const [cep, setCep] = useState('');
  const [cepError, setCepError] = useState('');
  const [cepResult, setCepResult] = useState<CepResult>({ status: 'idle' });
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  // Interactive smartphone mockup vote state
  const [voteChoice, setVoteChoice] = useState<'agree' | 'disagree' | null>(null);
  const [affectedChecked, setAffectedChecked] = useState(false);

  const baseAgree = 156;
  const baseDisagree = 44;
  const agreeCount = baseAgree + (voteChoice === 'agree' ? 1 : 0);
  const disagreeCount = baseDisagree + (voteChoice === 'disagree' ? 1 : 0);
  const totalVotes = agreeCount + disagreeCount;
  const agreePct = Math.round((agreeCount / totalVotes) * 100);
  const disagreePct = 100 - agreePct;

  const evaluateCep = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    if (digits.length !== 8) {
      setCepError('Digite os 8 números do seu CEP para continuar.');
      setCepResult({ status: 'idle' });
      return;
    }

    setCepError('');
    setJoinedWaitlist(false);

    if (digits.startsWith('122')) {
      setCepResult({ status: 'unlocked', cep: digits });
    } else {
      setCepResult({ status: 'waitlist', cep: digits });
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    if (cepError) setCepError('');
    const digits = formatted.replace(/\D/g, '');
    if (digits.length < 8 && cepResult.status !== 'idle') {
      setCepResult({ status: 'idle' });
      setJoinedWaitlist(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    evaluateCep(cep);
  };

  const handleQuickFill = (sampleCep: string) => {
    const formatted = formatCEP(sampleCep);
    setCep(formatted);
    evaluateCep(formatted);
  };

  const waitlistCount = joinedWaitlist ? 185 : 184;
  const waitlistGoal = 300;
  const waitlistPct = Math.round((waitlistCount / waitlistGoal) * 100);

  const whatsappText = encodeURIComponent(
    `O Connecta usa IA para ler o Diário Oficial e avisar o que muda no nosso bairro. Nossa cidade está com ${waitlistCount}/${waitlistGoal} moradores para liberar o acesso gratuito. Entra com seu CEP também!`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Subtle radial atmospheric glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[960px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 right-0 h-[360px] w-[360px] rounded-full bg-amber-500/5 blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Copy & Interactive CEP Widget */}
          <div className="lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm sm:text-sm">
              <span>🚀 Piloto Ativo em São José dos Campos</span>
              <span className="text-emerald-500/60">•</span>
              <span className="text-zinc-200">Expansão Nacional</span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[54px] lg:leading-[1.08]">
              O Diário Oficial da sua cidade tem{' '}
              <span className="text-zinc-400">80 páginas.</span> Nossa IA lê tudo em{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                3 segundos
              </span>{' '}
              e te avisa o que muda na sua rua.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Chega de descobrir que o trânsito do seu bairro mudou ou que aprovaram uma lei absurda só depois que já aconteceu. Acompanhe, vote e pressione com vizinhos reais verificados.
            </p>

            {/* Interactive CEP Conversion Widget */}
            <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#121215]/90 p-4 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-5">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <MapPin className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input
                    ref={cepInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    value={cep}
                    onChange={handleCepChange}
                    placeholder="Digite seu CEP (ex: 12230-000)"
                    aria-label="Digite seu CEP"
                    className="h-12 w-full rounded-xl border border-zinc-700/80 bg-[#09090B] pr-4 pl-11 text-base font-medium tracking-wide text-white placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-500 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.98]"
                >
                  <span>Entrar na Rede</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {cepError && (
                <p className="mt-2.5 text-xs font-medium text-amber-400">{cepError}</p>
              )}

              {/* Quick simulation shortcuts */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>Testar simulação:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('12230-000')}
                  className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  CEP SJC (12230-000)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('12308-000')}
                  className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-zinc-300 transition-colors hover:border-amber-500/40 hover:text-amber-300"
                >
                  Outra cidade (12308-000)
                </button>
              </div>

              {/* Result State: SJC Liberada (122*) */}
              {cepResult.status === 'unlocked' && (
                <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                          Cidade Liberada
                        </span>
                        <span className="text-xs text-zinc-400">
                          CEP {formatCEP(cepResult.cep)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-white sm:text-base">
                        Boa! São José dos Campos já está liberada. Crie sua conta de Cidadão Verificado agora.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/cadastro?cep=${cepResult.cep}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 transition-all hover:bg-emerald-400 sm:text-sm"
                        >
                          <span>Criar conta verificada</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                          href="/feed"
                          className="text-xs font-medium text-zinc-300 underline underline-offset-4 hover:text-white"
                        >
                          Espiar feed público de SJC
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Result State: Waitlist (Any other CEP) */}
              {cepResult.status === 'waitlist' && (
                <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                          Desbloqueio Comunitário
                        </span>
                        <span className="text-xs text-zinc-400">
                          CEP {formatCEP(cepResult.cep)}
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm font-semibold text-white">
                        Sua cidade está com{' '}
                        <span className="text-amber-300">
                          {waitlistCount}/{waitlistGoal} moradores na fila
                        </span>
                      </p>

                      {/* Progress bar */}
                      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-zinc-900">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${waitlistPct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-zinc-400">
                        Quando atingir {waitlistGoal} moradores verificados, ativamos a leitura automática do Diário Oficial na sua região.
                      </p>

                      <div className="mt-3.5 flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => setJoinedWaitlist(true)}
                          disabled={joinedWaitlist}
                          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                            joinedWaitlist
                              ? 'cursor-default border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                          }`}
                        >
                          {joinedWaitlist ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Você entrou na fila! (#{waitlistCount})</span>
                            </>
                          ) : (
                            <>
                              <Users className="h-4 w-4" />
                              <span>Entrar na Fila de Espera</span>
                            </>
                          )}
                        </button>

                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-zinc-100 transition-colors hover:border-emerald-500/50 hover:text-emerald-300 sm:text-sm"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Compartilhar no WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trust strip under widget */}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400 sm:text-sm">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>100% independente de prefeitura</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span>1 CPF = 1 Voz (Zero Bots)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Dados Oficiais + IA Cívica</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Dark Smartphone Mockup */}
          <div className="lg:col-span-5">
            <div className="mx-auto max-w-[360px]">
              {/* Phone Outer Frame */}
              <div className="relative rounded-[2.5rem] border border-zinc-800 bg-[#121215] p-3 shadow-[0_25px_70px_-15px_rgba(16,185,129,0.18)] ring-1 ring-white/5">
                {/* Notch & Status bar */}
                <div className="rounded-[2rem] border border-zinc-800/80 bg-[#09090B] px-4 pt-3 pb-5">
                  <div className="mb-4 flex items-center justify-between text-[11px] font-medium text-zinc-400">
                    <span>09:41</span>
                    <div className="h-4 w-20 rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      5G
                    </span>
                  </div>

                  {/* App Header inside Phone */}
                  <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div>
                      <p className="text-[11px] font-medium text-zinc-500">Seu Bairro Ativo</p>
                      <p className="text-sm font-bold text-white">Jardim Satélite • SJC</p>
                    </div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                      Feed Ao Vivo
                    </span>
                  </div>

                  {/* Interactive Demo Feed Card */}
                  <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-4 shadow-lg">
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        Jardim Satélite • Mobilidade
                      </span>
                      <span className="text-[10px] text-zinc-500">IA • 3s</span>
                    </div>

                    <h2 className="font-display text-sm font-bold leading-snug text-white sm:text-[15px]">
                      Nova ciclofaixa e alteração de mão única na Av. Andrômeda
                    </h2>

                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      Decreto muda o sentido da via entre os nº 1200 e 2400 e instala ciclofaixa no canteiro lateral a partir de segunda.
                    </p>

                    {/* Vote Progress Visual */}
                    <div className="mt-3.5">
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="bg-emerald-500 transition-all duration-300"
                          style={{ width: `${agreePct}%` }}
                        />
                        <div
                          className="bg-rose-500/80 transition-all duration-300"
                          style={{ width: `${disagreePct}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>{totalVotes} moradores verificados votaram</span>
                        <span>Teste clicando abaixo</span>
                      </div>
                    </div>

                    {/* Clickable Vote Buttons */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setVoteChoice((prev) => (prev === 'agree' ? null : 'agree'))
                        }
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                          voteChoice === 'agree'
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                            : 'border-zinc-800 bg-zinc-900/90 text-zinc-200 hover:border-emerald-500/40 hover:text-emerald-300'
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>Concordo ({agreePct}%)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setVoteChoice((prev) => (prev === 'disagree' ? null : 'disagree'))
                        }
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                          voteChoice === 'disagree'
                            ? 'border-rose-400 bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                            : 'border-zinc-800 bg-zinc-900/90 text-zinc-200 hover:border-rose-500/40 hover:text-rose-300'
                        }`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span>Discordo ({disagreePct}%)</span>
                      </button>
                    </div>
                  </div>

                  {/* Secondary Mini Card (Zeladoria Urbana) */}
                  <div className="mt-3 rounded-xl border border-zinc-800/80 bg-[#121215]/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                          Zeladoria • Rua Bacabal
                        </span>
                        <p className="truncate text-xs font-semibold text-zinc-200">
                          Iluminação apagada no ponto de ônibus
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAffectedChecked((v) => !v)}
                        className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          affectedChecked
                            ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600'
                        }`}
                      >
                        {affectedChecked ? '✓ +29 afetados' : 'Também me afeta (28)'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

