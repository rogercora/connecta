'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { gerarNumeroProtocolo } from '@/lib/utils/protocolo';
import { useFeedStore } from '@/stores/feedStore';
import { useAuthStore } from '@/stores/authStore';
import { CategoriaComunidade } from '@/types/database';

export default function PostarPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const adicionarPost = useFeedStore((s) => s.adicionarPost);

  const [categoria, setCategoria] = useState<CategoriaComunidade>('buraco');
  const [descricao, setDescricao] = useState('');
  const [fotoUrl, setFotoUrl] = useState('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80');
  const [loading, setLoading] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);

  const categorias: { id: CategoriaComunidade; label: string }[] = [
    { id: 'buraco', label: '🕳️ Buraco na via' },
    { id: 'iluminacao', label: '💡 Poste sem luz' },
    { id: 'lixo', label: '🗑️ Descarte irregular' },
    { id: 'alagamento', label: '🌊 Alagamento' },
    { id: 'transporte', label: '🚌 Ponto de ônibus' },
    { id: 'outro', label: '⚠️ Outro problema' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    setLoading(true);
    const novoProtocolo = gerarNumeroProtocolo();

    setTimeout(() => {
      adicionarPost({
        id: `post-${Date.now()}`,
        user_id: user?.id || 'demo-user',
        user: user || undefined,
        foto_url: fotoUrl,
        descricao: `${descricao} Já protocolado na Prefeitura (nº ${novoProtocolo}). #${categoria} #${user?.bairro?.toLowerCase() || 'bairro'}`,
        cep: user?.cep || '04266-000',
        bairro: user?.bairro || 'Ipiranga',
        categoria,
        numero_protocolo: novoProtocolo,
        curtidas: 1,
        created_at: new Date().toISOString(),
      });

      setLoading(false);
      setProtocoloGerado(novoProtocolo);
    }, 500);
  };

  if (protocoloGerado) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-black text-gray-900">
          Zeladoria Registrada com Sucesso!
        </h2>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
          <p className="text-xs text-emerald-800 font-semibold">Número de Protocolo Oficial:</p>
          <p className="text-2xl font-black text-emerald-700 tracking-wider">
            {protocoloGerado}
          </p>
          <p className="text-[10px] text-emerald-600">
            Encaminhado automaticamente ao canal de zeladoria do Município.
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full rounded-xl py-3 font-bold"
          onClick={() => router.push('/feed')}
        >
          Ver no Feed do Bairro
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <button onClick={() => router.back()} className="p-1 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-extrabold text-gray-900">Reportar Problema no Bairro</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Foto Preview / Upload */}
        <div className="w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-500 overflow-hidden relative cursor-pointer hover:border-emerald-500 transition-colors">
          <Camera className="w-8 h-8 text-emerald-600 mb-1" />
          <span className="text-xs font-semibold text-gray-700">Tirar foto do problema</span>
          <span className="text-[10px] text-gray-400">Geolocalização anexada automaticamente</span>
        </div>

        {/* Seleção de Categoria */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-2 block">
            Selecione a categoria:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoria(cat.id)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                  categoria === cat.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1.5 block">
            Descrição do que precisa de reparo:
          </label>
          <textarea
            required
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Gente, esse buraco na Rua Agostinho Gomes está enorme e perigoso..."
            className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Bairro vinculado */}
        <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>
            Publicação vinculada ao <strong>{user?.bairro || 'Ipiranga'}</strong> (CEP: {user?.cep || '04266-000'})
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full rounded-xl py-3 font-bold"
          isLoading={loading}
        >
          Publicar e Gerar Protocolo
        </Button>
      </form>
    </div>
  );
}

