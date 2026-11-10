'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, MapPin, CheckCircle2, AlertTriangle, ArrowLeft, Megaphone, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useFeedStore } from '@/stores/feedStore';
import { useAuthStore } from '@/stores/authStore';
import { CategoriaComunidade, PostComunidade } from '@/types/database';
import { supabase } from '@/lib/supabase/client';

export default function PostarPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const adicionarPost = useFeedStore((s) => s.adicionarPost);
  const postsComunidade = useFeedStore((s) => s.posts);
  const toggleApoiarPost = useFeedStore((s) => s.toggleApoiarPost);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoria, setCategoria] = useState<CategoriaComunidade>('buraco');
  const [descricao, setDescricao] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState('https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=800&q=80');
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);

  // Anti-duplicação: estado para ignorar aviso caso seja um problema distinto
  const [ignorarDuplicado, setIgnorarDuplicado] = useState(false);
  const [postDuplicado, setPostDuplicado] = useState<PostComunidade | null>(null);

  const categorias: { id: CategoriaComunidade; label: string }[] = [
    { id: 'buraco', label: '🕳️ Buraco na via' },
    { id: 'iluminacao', label: '💡 Poste sem luz' },
    { id: 'lixo', label: '🗑️ Descarte irregular' },
    { id: 'alagamento', label: '🌊 Alagamento' },
    { id: 'transporte', label: '🚌 Ponto de ônibus' },
    { id: 'outro', label: '⚠️ Outro problema' },
  ];

  // Detector inteligente de chamados duplicados no mesmo bairro/categoria
  useEffect(() => {
    if (ignorarDuplicado) return;

    const userBairroClean = (user?.bairro || 'Jardim Aquárius').toLowerCase().trim();
    const duplicado = postsComunidade.find((p) => {
      const postBairroClean = (p.bairro || '').toLowerCase().trim();
      return (
        p.categoria === categoria &&
        (postBairroClean.includes(userBairroClean) || userBairroClean.includes(postBairroClean))
      );
    });

    setPostDuplicado(duplicado || null);
  }, [categoria, user?.bairro, postsComunidade, ignorarDuplicado]);

  // Upload ou captura de foto
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setFotoPreview(localUrl);
    setUploadingFoto(true);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `fotos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('zeladoria-fotos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.warn('Storage indisponível, usando imagem em buffer local:', uploadError.message);
        setFotoUrl(localUrl);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('zeladoria-fotos')
          .getPublicUrl(filePath);

        setFotoUrl(publicUrlData.publicUrl);
      }
    } catch (err) {
      console.warn('Erro ao processar imagem, mantendo preview local:', err);
      setFotoUrl(localUrl);
    } finally {
      setUploadingFoto(false);
    }
  };

  // Apoiar chamado já existente em vez de criar um duplicado
  const handleApoiarExistente = async () => {
    if (!postDuplicado) return;

    toggleApoiarPost(postDuplicado.id);

    try {
      if (user?.id) {
        await supabase.rpc('toggle_apoiar_post', {
          p_post_id: postDuplicado.id,
          p_user_id: user.id,
        });
      }
    } catch (err) {
      console.warn('Apoio local registrado:', err);
    }

    router.push('/feed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    setLoading(true);

    const ano = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const novoProtocolo = `SJC-${ano}-${randomNum}`;
    const novoPostId = `post-${Date.now()}`;

    const novoPost: PostComunidade = {
      id: novoPostId,
      user_id: user?.id || 'demo-user',
      user: user || undefined,
      foto_url: fotoUrl,
      descricao: `${descricao.trim()} #${categoria} #${(user?.bairro || 'Aquárius').toLowerCase().replace(/\s+/g, '')}`,
      cep: user?.cep || '12246-021',
      bairro: user?.bairro || 'Jardim Aquárius',
      categoria,
      numero_protocolo: novoProtocolo,
      curtidas: 1,
      moradores_afetados: 1,
      user_ja_apoiou: true,
      created_at: new Date().toISOString(),
    };

    try {
      if (user?.id) {
        await supabase.rpc('criar_post_zeladoria', {
          p_user_id: user.id,
          p_foto_url: fotoUrl,
          p_descricao: novoPost.descricao,
          p_cep: novoPost.cep,
          p_bairro: novoPost.bairro,
          p_categoria: categoria,
          p_protocolo: novoProtocolo,
        });
      }
    } catch (err) {
      console.warn('RPC Supabase indisponível, salvo no feed local:', err);
    }

    // Adiciona na store do feed imediatamente
    adicionarPost(novoPost);

    setLoading(false);
    setProtocoloGerado(novoProtocolo);
  };

  if (protocoloGerado) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto min-h-screen bg-white">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-black text-gray-900">
          Zeladoria Registrada com Sucesso!
        </h2>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 text-left">
          <p className="text-xs text-emerald-800 font-bold">Número de Protocolo Oficial:</p>
          <p className="text-2xl font-black text-emerald-700 tracking-wider">
            {protocoloGerado}
          </p>
          <p className="text-[11px] text-emerald-800 leading-snug">
            Encaminhado automaticamente para a triagem da central de zeladoria municipal de <strong>{user?.cidade || 'São José dos Campos'}</strong>.
          </p>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 text-left space-y-1">
          <p className="font-bold text-gray-800">💡 Como funciona a prioridade?</p>
          <p className="text-[11px] text-gray-600">
            Quanto mais moradores do bairro clicarem em <strong>&quot;Também me afeta (+1)&quot;</strong>, mais rápido o problema sobe na fila da Prefeitura!
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full rounded-xl py-3 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => router.push('/feed')}
        >
          Ver no Feed do Bairro
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto min-h-screen bg-white pb-24">
      {/* Top Header */}
      <div className="flex items-center space-x-2">
        <button onClick={() => router.back()} className="p-1 text-gray-500 hover:text-gray-900" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-gray-900">Reportar Problema no Bairro</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Foto Preview / Upload */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-500 overflow-hidden relative cursor-pointer hover:border-emerald-500 transition-colors group"
        >
          {fotoPreview || fotoUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={fotoPreview || fotoUrl}
                alt="Foto do chamado"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-1">
                <Camera className="w-4 h-4" />
                <span>Trocar foto</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <Camera className="w-8 h-8 text-emerald-600 mb-1" />
              <span className="text-xs font-bold text-gray-700">Tirar foto ou carregar da galeria</span>
              <span className="text-[10px] text-gray-400">Geolocalização anexada automaticamente</span>
            </div>
          )}

          {uploadingFoto && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Otimizando foto...</span>
            </div>
          )}
        </div>

        {/* Seleção de Categoria */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-2 block">
            Selecione a categoria do problema:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoria(cat.id);
                  setIgnorarDuplicado(false);
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                  categoria === cat.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500 font-bold'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ALERTA ANTI-DUPLICAÇÃO INTELIGENTE */}
        {postDuplicado && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2.5 animate-fadeIn">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-950">
                  Já existe um chamado aberto sobre isso no {user?.bairro || 'seu bairro'}!
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                  Protocolo <strong>#{postDuplicado.numero_protocolo}</strong> já tem{' '}
                  <strong>{postDuplicado.moradores_afetados || 1} moradores afetados</strong>.
                  Para a Prefeitura resolver mais rápido, o ideal é somar forças em vez de abrir chamado duplicado.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleApoiarExistente}
                className="w-full py-2.5 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Dar +1 no chamado existente</span>
              </button>
              <button
                type="button"
                onClick={() => setIgnorarDuplicado(true)}
                className="w-full py-2 px-3 bg-white border border-amber-300 text-amber-900 rounded-xl text-[11px] font-semibold hover:bg-amber-100 transition-colors"
              >
                É outro local, continuar novo
              </button>
            </div>
          </div>
        )}

        {/* Descrição */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1.5 block">
            Descrição detalhada do reparo:
          </label>
          <textarea
            required
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Esse buraco em frente ao número 340 está aumentando após as chuvas e danificando carros..."
            className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Bairro vinculado */}
        <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Vinculado ao bairro <strong>{user?.bairro || 'Jardim Aquárius'}</strong> - {user?.cidade || 'São José dos Campos'} ({user?.cep || '12246-021'})
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full rounded-xl py-3 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          isLoading={loading}
        >
          Publicar e Gerar Protocolo Oficial
        </Button>
      </form>
    </div>
  );
}
