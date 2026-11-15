'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MessageCircle, PenLine, X, ArrowRight, Sparkles, Megaphone } from 'lucide-react';
import { ProcessItem, buildWhatsAppUrl } from './shared';

interface PetitionModalProps {
  onClose: () => void;
  onCreate: (item: ProcessItem) => void;
  onViewList: () => void;
}

const TARGETS = [
  'Prefeitura Municipal',
  'Câmara de Vereadores',
  'Secretaria de Mobilidade',
  'Secretaria de Manutenção / Zeladoria',
  'Secretaria de Saúde',
];

const GOALS = [100, 300, 500, 1000];

export const PetitionModal: React.FC<PetitionModalProps> = ({ onClose, onCreate, onViewList }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [target, setTarget] = useState(TARGETS[0]);
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState(300);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<ProcessItem | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 10) next.title = 'Escreva um título com pelo menos 10 caracteres.';
    if (location.trim().length < 3) next.location = 'Informe o bairro e a cidade.';
    if (description.trim().length < 30) next.description = 'Conte o problema em pelo menos 30 caracteres.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const item: ProcessItem = {
      id: `user-${Date.now()}`,
      category: 'peticao',
      location: location.trim(),
      title: title.trim(),
      summary: `${description.trim()} (Destinatário: ${target})`,
      supporters: 1,
      goal,
      isUserCreated: true,
    };
    onCreate(item);
    setCreated(item);
  };

  const fieldClass = (hasError: boolean) =>
    `mt-1.5 w-full rounded-2xl border-2 bg-zinc-50/70 px-4 py-3 text-[15px] text-zinc-950 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-4 transition-all ${
      hasError
        ? 'border-red-400 focus:ring-red-400/15'
        : 'border-zinc-200 focus:border-crimson-600 focus:ring-crimson-600/15'
    }`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="petition-modal-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl border border-zinc-200"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4.5">
          <h2 id="petition-modal-title" className="flex items-center gap-2 font-display text-lg font-extrabold text-zinc-950">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-crimson-50 text-crimson-600">
              <Megaphone className="h-4 w-4" />
            </span>
            {created ? 'Abaixo-assinado no ar!' : 'Novo Abaixo-Assinado do Bairro'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {created ? (
          <div className="p-6 sm:p-7">
            <div className="rounded-2xl border-2 border-crimson-200 bg-crimson-50/70 p-5">
              <p className="flex items-center gap-2 font-display text-base font-extrabold text-crimson-900">
                <CheckCircle2 className="h-5 w-5 text-crimson-600" />
                Sua petição já está no ar e você é o apoiador nº 1!
              </p>
              <p className="mt-2.5 font-display text-lg font-bold text-zinc-950">{created.title}</p>
              <p className="mt-1 text-sm text-zinc-600">
                {created.location} • Meta inicial: {created.goal} assinaturas
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              Causas compartilhadas no grupo da rua e condomínio nas primeiras 24 horas batem a meta até 4x mais rápido. Comece agora:
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={buildWhatsAppUrl(
                  `Criei um abaixo-assinado: "${created.title}" (${created.location}). Precisamos de ${created.goal} vizinhos para protocolar na gestão pública. Assine e apoie com 1 clique:`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-crimson-600 px-5 py-3.5 text-sm font-bold text-white shadow-crimson-btn transition-all hover:bg-crimson-700"
              >
                <MessageCircle className="h-4 w-4" />
                Compartilhar no WhatsApp
              </a>
              <button
                type="button"
                onClick={onViewList}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-5 py-3.5 text-sm font-bold text-zinc-900 hover:bg-zinc-100 cursor-pointer"
              >
                Ver na lista
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4.5 p-6 sm:p-7">
            <div>
              <label htmlFor="pet-title" className="text-sm font-bold text-zinc-800">
                O que você quer mudar no seu bairro?
              </label>
              <input
                id="pet-title"
                ref={firstFieldRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Instalação de semáforo na Av. Andrômeda"
                maxLength={120}
                className={fieldClass(!!errors.title)}
              />
              {errors.title && <p className="mt-1 text-xs font-semibold text-red-600">{errors.title}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pet-loc" className="text-sm font-bold text-zinc-800">
                  Bairro e Cidade
                </label>
                <input
                  id="pet-loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Jardim Satélite, SJC"
                  className={fieldClass(!!errors.location)}
                />
                {errors.location && <p className="mt-1 text-xs font-semibold text-red-600">{errors.location}</p>}
              </div>

              <div>
                <label htmlFor="pet-target" className="text-sm font-bold text-zinc-800">
                  Destinatário da cobrança
                </label>
                <select
                  id="pet-target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border-2 border-zinc-200 bg-zinc-50/70 px-4 py-3 text-[15px] font-medium text-zinc-950 focus:bg-white focus:border-crimson-600 focus:outline-none"
                >
                  {TARGETS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="pet-desc" className="text-sm font-bold text-zinc-800">
                Conte o problema em detalhes
              </label>
              <textarea
                id="pet-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explique por que essa mudança é urgente e quem são as pessoas afetadas todos os dias..."
                className={fieldClass(!!errors.description)}
              />
              {errors.description && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-800">Meta inicial de assinaturas</label>
              <div className="mt-2 flex gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`flex-1 rounded-full border py-2 text-xs font-bold transition-all cursor-pointer ${
                      goal === g
                        ? 'border-crimson-600 bg-crimson-600 text-white shadow-xs'
                        : 'border-zinc-200 bg-zinc-50/70 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-crimson-600 px-6 py-4 text-base font-bold text-white shadow-crimson-btn transition-all hover:bg-crimson-700 active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="h-5 w-5" />
                Publicar Abaixo-Assinado Gratuito
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
