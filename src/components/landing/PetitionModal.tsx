'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MessageCircle, PenLine, X, ArrowRight } from 'lucide-react';
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

  // Fecha com ESC, trava rolagem do fundo e foca o primeiro campo
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
    `mt-1.5 w-full rounded-lg border-2 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 ${
      hasError
        ? 'border-red-500 focus:ring-red-500/15'
        : 'border-zinc-300 focus:border-sky-600 focus:ring-sky-600/15'
    }`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="petition-modal-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 sm:px-6">
          <h2 id="petition-modal-title" className="flex items-center gap-2 font-display text-lg font-extrabold text-zinc-900">
            <PenLine className="h-5 w-5 text-orange-600" />
            {created ? 'Abaixo-assinado criado!' : 'Novo abaixo-assinado gratuito'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-[#F4F5F7] hover:text-zinc-900"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {created ? (
          <div className="p-5 sm:p-6">
            <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 font-semibold text-emerald-800">
                <CheckCircle2 className="h-5 w-5" />
                Sua petição já está no ar e você é a assinatura nº 1.
              </p>
              <p className="mt-2 font-display text-lg font-bold text-zinc-900">{created.title}</p>
              <p className="mt-1 text-sm text-zinc-600">
                {created.location} • Meta: {created.goal} assinaturas
              </p>
            </div>
            <p className="mt-4 text-sm text-zinc-600">
              Petições compartilhadas na primeira hora têm muito mais chance de bater a meta. Comece pelo grupo do seu prédio ou da sua rua.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <a
                href={buildWhatsAppUrl(
                  `Criei um abaixo-assinado: "${created.title}" (${created.location}). Precisamos de ${created.goal} vizinhos para protocolar. Assina e compartilha:`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                <MessageCircle className="h-4 w-4" />
                Compartilhar no WhatsApp
              </a>
              <button
                type="button"
                onClick={onViewList}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-900 px-4 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-900 hover:text-white"
              >
                Ver na lista
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5 sm:p-6">
            <div>
              <label htmlFor="pet-title" className="text-sm font-semibold text-zinc-800">
                O que você quer mudar?
              </label>
              <input
                id="pet-title"
                ref={firstFieldRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Lombada em frente à escola Maria Peregrina"
                maxLength={120}
                className={fieldClass(!!errors.title)}
              />
              {errors.title && <p className="mt-1 text-xs font-medium text-red-700">{errors.title}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pet-location" className="text-sm font-semibold text-zinc-800">
                  Bairro e cidade
                </label>
                <input
                  id="pet-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Jardim Satélite • SJC"
                  className={fieldClass(!!errors.location)}
                />
                {errors.location && <p className="mt-1 text-xs font-medium text-red-700">{errors.location}</p>}
              </div>
              <div>
                <label htmlFor="pet-target" className="text-sm font-semibold text-zinc-800">
                  Para quem é o pedido?
                </label>
                <select
                  id="pet-target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className={fieldClass(false)}
                >
                  {TARGETS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="pet-desc" className="text-sm font-semibold text-zinc-800">
                Por que isso importa para os vizinhos?
              </label>
              <textarea
                id="pet-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={600}
                placeholder="Conte o problema como contaria para um vizinho: o que acontece, há quanto tempo e quem é afetado."
                className={`${fieldClass(!!errors.description)} resize-none`}
              />
              <div className="mt-1 flex justify-between text-xs">
                <span className="font-medium text-red-700">{errors.description}</span>
                <span className="text-zinc-500">{description.length}/600</span>
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-zinc-800">Meta de assinaturas</legend>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    aria-pressed={goal === g}
                    className={`rounded-lg border-2 py-2 text-sm font-bold transition-colors ${
                      goal === g
                        ? 'border-orange-600 bg-orange-50 text-orange-800'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 text-base font-bold text-white shadow-sm hover:bg-orange-700"
            >
              <PenLine className="h-5 w-5" />
              Publicar abaixo-assinado
            </button>
            <p className="text-center text-xs text-zinc-500">
              Gratuito. Só moradores verificados por CEP podem assinar.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
