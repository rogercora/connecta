'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Megaphone,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useFeedStore } from '@/stores/feedStore';
import { useAuthStore } from '@/stores/authStore';
import { CategoriaComunidade, PostComunidade } from '@/types/database';
import { supabase } from '@/lib/supabase/client';
import { usePosts } from '@/hooks/useFeedReal';

export default function PostarPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const adicionarPost = useFeedStore((s) => s.adicionarPost);
  const toggleApoiarPost = useFeedStore((s) => s.toggleApoiarPost);

  const { data: postsReais = [] } = usePosts(
    'bairro',
    user?.cidade || 'São José dos Campos',
    user?.bairro || 'Jardim Aquárius'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoria, setCategoria] = useState<CategoriaComunidade>('buraco');
  const [descricao, setDescricao] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);

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

  useEffect(() => {
    if (ignorarDuplicado || !user?.bairro) return;

    const userBairroClean = user.bairro.toLowerCase().trim();
    const duplicado = postsReais.find((p) => {
      const postBairroClean = (p.bairro || '').toLowerCase().trim();
      return (
        p.categoria === categoria &&
        (postBairroClean.includes(userBairroClean) || userBairroClean.includes(postBairroClean))
      );
    });

    setPostDuplicado(duplicado || null);
  }, [categoria, user?.bairro, postsReais, ignorarDuplicado]);

  // Upload real no bucket zeladoria-fotos (pasta do próprio usuário)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setErrorMsg(null);

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Envie apenas imagens nos formatos JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A foto deve ter no máximo 5 MB.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setFotoPreview(localUrl);
    setUploadingFoto(true);

    try {
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };
      const fileExt = extMap[file.type] || 'jpg';
      const fileName = `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('zeladoria-fotos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setFotoUrl(null);
        setFotoPreview(null);
        setErrorMsg('Falha ao enviar a foto para o servidor. Verifique sua conexão e tente novamente.');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('zeladoria-fotos')
        .getPublicUrl(filePath);

      setFotoUrl(publicUrlData.publicUrl);
    } catch {
      setFotoUrl(null);
      setFotoPreview(null);
      setErrorMsg('Erro inesperado ao enviar imagem.');
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleApoiarExistente = async () => {
    if (!postDuplicado || !user?.id) return;

    toggleApoiarPost(postDuplicado.id);

    const { error } = await supabase.rpc('toggle_apoiar_post', {
      p_post_id: postDuplicado.id,
    });

    if (error) {
      setErrorMsg('Não foi possível registrar seu apoio. Tente novamente.');
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['posts'] });
    router.push('/feed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user?.id) {
      router.push('/login?next=/postar');
      return;
    }

    if (!descricao.trim()) return;
    if (uploadingFoto) {
      setErrorMsg('Aguarde o envio da foto terminar.');
      return;
    }

    setLoading(true);

    const ano = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const prefixo = (user.estado || 'BR').toUpperCase().slice(0, 2);
    const novoProtocolo = `${prefixo}-${ano}-${randomNum}`;

    const bairroLimpo = user.bairro || 'Centro';
    const descricaoFinal = `${descricao.trim()} #${categoria} #${bairroLimpo.toLowerCase().replace(/\s+/g, '')}`;
    const imagemFinal =
      fotoUrl ||
      'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=800&q=80';

    try {
      const { data, error } = await supabase.rpc('criar_post_zeladoria', {
        p_foto_url: imagemFinal,
        p_descricao: descricaoFinal,
        p_cep: user.cep || '00000-000',
        p_bairro: bairroLimpo,
        p_categoria: categoria,
        p_protocolo: novoProtocolo,
      });

      if (error || !data?.post_id) {
        setErrorMsg(error?.message || 'Não foi possível salvar o chamado no banco de dados.');
        setLoading(false);
        return;
      }

      const novoPost: PostComunidade = {
        id: data.post_id,
        user_id: user.id,
        user,
        foto_url: imagemFinal,
        descricao: descricaoFinal,
        cep: user.cep || '00000-000',
        bairro: bairroLimpo,
        categoria,
        numero_protocolo: novoProtocolo,
        curtidas: 0,
        moradores_afetados: 1,
        user_ja_apoiou: true,
        created_at: new Date().toISOString(),
      };

      adicionarPost(novoPost);
      await queryClient.invalidateQueries({ queryKey: ['posts'] });

      setLoading(false);
      setProtocoloGerado(novoProtocolo);
    } catch {
      setErrorMsg('Falha de rede ao publicar chamado.');
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="p-8 text-center text-xs text-gray-500">
        Verificando sua sessão...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-gray-900">Faça login para cobrar zeladoria</p>
        <p className="text-xs text-gray-500">
          Sua conta vincula o chamado ao seu bairro e gera o protocolo oficial.
        </p>
        <Link
          href="/login?next=/postar"
          className="inline-flex items-center justify-center rounded-xl py-3 px-6 text-xs font-bold bg-crimson-600 text-white"
        >
          Entrar na Conta
        </Link>
      </div>
    );
  }

  if (protocoloGerado) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto min-h-screen bg-white">
        <div className="w-16 h-16 bg-crimson-100 text-crimson-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-black text-gray-900">
          Zeladoria Registrada com Sucesso!
        </h2>

        <div className="p-4 bg-crimson-50 border border-crimson-200 rounded-2xl space-y-1.5 text-left">
          <p className="text-xs text-crimson-800 font-bold">Número de Protocolo Oficial:</p>
          <p className="text-2xl font-black text-crimson-700 tracking-wider">
            {protocoloGerado}
          </p>
          <p className="text-[11px] text-crimson-800 leading-snug">
            Registrado para a central de zeladoria de <strong>{user.cidade}</strong>.
          </p>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 text-left space-y-1">
          <p className="font-bold text-gray-800">💡 Como funciona a prioridade?</p>
          <p className="text-[11px] text-gray-600">
            Quanto mais moradores do bairro clicarem em <strong>&quot;Também me afeta (+1)&quot;</strong>, mais rápido o problema sobe na fila de cobrança!
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full rounded-xl py-3 font-bold bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson-btn"
          onClick={() => router.push('/feed')}
        >
          Ver no Feed do Bairro
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto min-h-screen bg-white pb-24">
      <div className="flex items-center space-x-2">
        <button onClick={() => router.back()} className="p-1 text-gray-500 hover:text-gray-900" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-gray-900">Reportar Problema no Bairro</h2>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-500 overflow-hidden relative cursor-pointer hover:border-crimson-500 transition-colors group"
        >
          {fotoPreview || fotoUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={fotoPreview || fotoUrl || ''}
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
              <Camera className="w-8 h-8 text-crimson-600 mb-1" />
              <span className="text-xs font-bold text-gray-700">Tirar foto ou carregar da galeria</span>
              <span className="text-[10px] text-gray-400">JPG, PNG ou WebP até 5 MB</span>
            </div>
          )}

          {uploadingFoto && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Enviando foto...</span>
            </div>
          )}
        </div>

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
                    ? 'border-crimson-600 bg-crimson-50 text-crimson-900 ring-1 ring-crimson-600 font-bold'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {postDuplicado && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2.5 animate-fadeIn">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-950">
                  Já existe um chamado aberto sobre isso no {user.bairro}!
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                  Protocolo <strong>#{postDuplicado.numero_protocolo}</strong> já tem{' '}
                  <strong>{postDuplicado.moradores_afetados || 1} moradores afetados</strong>.
                  Para resolver mais rápido, o ideal é somar forças em vez de abrir chamado duplicado.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleApoiarExistente}
                className="w-full py-2.5 px-3 bg-crimson-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 hover:bg-crimson-700 active:scale-95 transition-all shadow-crimson-btn"
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
            className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-crimson-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <MapPin className="w-4 h-4 text-crimson-600 flex-shrink-0" />
          <span>
            Vinculado ao bairro <strong>{user.bairro}</strong> - {user.cidade} ({user.cep})
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full rounded-xl py-3 font-bold bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson-btn"
          isLoading={loading}
          disabled={uploadingFoto}
        >
          Publicar e Gerar Protocolo Oficial
        </Button>
      </form>
    </div>
  );
}
