'use client';

import React, { useState } from 'react';
import { X, Megaphone, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';

interface CriarAbaixoAssinadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (novaCausa: {
    titulo: string;
    bairro: string;
    cidade: string;
    estado: string;
    meta: number;
    resumo: string;
  }) => void;
}

export const CriarAbaixoAssinadoModal: React.FC<CriarAbaixoAssinadoModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const user = useAuthStore((s) => s.user);

  const [titulo, setTitulo] = useState('');
  const [bairro, setBairro] = useState(user?.bairro || 'Jardim Aquárius');
  const [cidade, setCidade] = useState(user?.cidade || 'São José dos Campos');
  const [meta, setMeta] = useState('100');
  const [resumo, setResumo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !resumo.trim()) return;

    setLoading(true);
    setTimeout(() => {
      onCreated({
        titulo: titulo.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: user?.estado || 'SP',
        meta: parseInt(meta) || 100,
        resumo: resumo.trim(),
      });
      setLoading(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-crimson-50 text-crimson-600 flex items-center justify-center border border-crimson-200">
              <Megaphone className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-950 leading-tight">
                Criar Novo Abaixo-Assinado
              </h3>
              <p className="text-[11px] text-zinc-500">
                Inicie uma mobilização coletiva auditada para o seu bairro
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <Input
            label="Título da Causa ou Reivindicação"
            placeholder="Ex: Reforma e Iluminação na Praça do Bairro"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bairro"
              placeholder="Ex: Jardim Aquárius"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              required
            />
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Meta de Assinaturas
              </label>
              <select
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-crimson-600 focus:outline-none bg-white"
              >
                <option value="50">50 moradores (Pequeno porte)</option>
                <option value="100">100 moradores (Recomendado)</option>
                <option value="250">250 moradores (Bairro amplo)</option>
                <option value="500">500 moradores (Cidade inteira)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 block">
              Descrição e justificativa do pedido:
            </label>
            <textarea
              required
              rows={3}
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              placeholder="Explique o que precisa ser feito e por que afeta a qualidade de vida dos moradores..."
              className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-crimson-600 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl text-[11px] text-zinc-600 border border-zinc-200 space-y-1">
            <p className="font-bold text-zinc-800">🛡️ Validação Automática:</p>
            <p>
              Ao atingir a meta escolhida, o sistema gera a certidão em PDF com quórum verificado pronta para entrega protocolada aos vereadores.
            </p>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl text-xs font-semibold py-2.5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="flex-1 rounded-xl text-xs font-bold py-2.5 bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson-btn"
            >
              Publicar Abaixo-Assinado
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

