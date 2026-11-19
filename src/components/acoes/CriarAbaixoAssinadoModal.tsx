'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, FileSignature, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { Peticao } from '@/types/database';

interface CriarAbaixoAssinadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (peticao: Peticao) => void;
  quorumCidade?: number;
}

export const CriarAbaixoAssinadoModal: React.FC<CriarAbaixoAssinadoModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  quorumCidade = 50,
}) => {
  const { user, isAuthenticated } = useAuthStore();

  const [titulo, setTitulo] = useState('');
  const [bairro, setBairro] = useState(user?.bairro || 'Jardim Aquárius');
  const [vereadorAlvo, setVereadorAlvo] = useState('Câmara Municipal / Vereadores');
  const [resumo, setResumo] = useState('');
  const [argumentoExtra, setArgumentoExtra] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const cidade = user?.cidade || 'São José dos Campos';
  const estado = user?.estado || 'SP';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAuthenticated) {
      setErrorMsg('Você precisa entrar na sua conta para propor uma petição oficial.');
      return;
    }

    if (titulo.trim().length < 6 || resumo.trim().length < 15) {
      setErrorMsg('Preencha um título (mín. 6 caracteres) e o resumo do pedido (mín. 15 caracteres).');
      return;
    }

    setLoading(true);
    try {
      const argumentos = argumentoExtra
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const res = await fetch('/api/peticoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo.trim(),
          resumo: resumo.trim(),
          bairro: bairro.trim() || user?.bairro || 'Centro',
          vereador_alvo: vereadorAlvo.trim() || 'Câmara Municipal',
          argumentos,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || 'Não foi possível criar sua petição.');
        return;
      }

      if (data.peticao) {
        onCreated(data.peticao as Peticao);
      }

      setTitulo('');
      setResumo('');
      setArgumentoExtra('');
      onClose();
    } catch {
      setErrorMsg('Erro de rede ao salvar petição no servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-zinc-200 max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-crimson-50 text-crimson-600 flex items-center justify-center border border-crimson-200">
              <FileSignature className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-950 leading-tight">
                Propor Petição Comunitária
              </h3>
              <p className="text-[10px] text-zinc-500 font-semibold">
                {cidade}/{estado} • Meta da cidade: {quorumCidade} assinaturas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-full hover:bg-zinc-100"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto text-xs">
          {!isAuthenticated && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Entre com sua conta para assinar e enviar sua proposta.</span>
              </div>
              <Link href="/login?next=/acoes" className="font-bold text-crimson-700 underline shrink-0">
                Entrar
              </Link>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-crimson-50/70 border border-crimson-200/80 text-[11px] text-crimson-950 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-crimson-600 shrink-0 mt-0.5" />
            <span>
              Amparado pelo <strong>Art. 5º, XXXIV, &ldquo;a&rdquo; da CF/88</strong>. Sua causa entra com 1 assinatura sua e passa por validação rápida no Admin antes de abrir coleta pública.
            </span>
          </div>

          <div>
            <label className="font-bold text-zinc-800 block mb-1">Título da Causa *</label>
            <input
              type="text"
              required
              placeholder="Ex: Instalação de semáforo na Av. Shishima Hifumi"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-crimson-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-zinc-800 block mb-1">Bairro Principal *</label>
              <input
                type="text"
                required
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-crimson-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-800 block mb-1">Destinatário Público</label>
              <input
                type="text"
                value={vereadorAlvo}
                onChange={(e) => setVereadorAlvo(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-crimson-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-zinc-800 block mb-1">O que está sendo solicitado? *</label>
            <textarea
              rows={3}
              required
              placeholder="Explique o problema local e o que os moradores pedem à Câmara ou Prefeitura..."
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-crimson-600 focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-800 block mb-1">
              Argumentos / Fatos de Apoio (1 por linha, opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Risco diário em frente à escola estadual&#10;Protocolo anterior sem retorno há 60 dias"
              value={argumentoExtra}
              onChange={(e) => setArgumentoExtra(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-crimson-600 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="pt-1 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={!isAuthenticated}
              className="py-2.5 px-5 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white font-bold shadow-crimson-btn"
            >
              Enviar Petição
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
