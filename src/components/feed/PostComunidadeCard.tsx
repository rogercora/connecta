'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, Check, Megaphone, FileText } from 'lucide-react';
import { PostComunidade } from '@/types/database';
import { useFeedStore } from '@/stores/feedStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase/client';

interface PostComunidadeCardProps {
  post: PostComunidade & { user?: any };
}

export const PostComunidadeCard: React.FC<PostComunidadeCardProps> = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const curtirPost = useFeedStore((s) => s.curtirPost);
  const toggleApoiarPost = useFeedStore((s) => s.toggleApoiarPost);
  const currentUser = useAuthStore((s) => s.user);

  // Estado local para "Também me afeta (+1)"
  const [apoiado, setApoiado] = useState(!!post.user_ja_apoiou);
  const [moradoresCount, setMoradoresCount] = useState(post.moradores_afetados || 1);
  const [isUpdatingApoio, setIsUpdatingApoio] = useState(false);

  const handleLike = () => {
    if (!liked) {
      curtirPost(post.id);
      setLiked(true);
    } else {
      setLiked(false);
    }
  };

  const handleToggleAfeta = async () => {
    if (isUpdatingApoio) return;
    setIsUpdatingApoio(true);

    const novoEstado = !apoiado;
    const novoTotal = novoEstado ? moradoresCount + 1 : Math.max(1, moradoresCount - 1);

    // Otimista na UI
    setApoiado(novoEstado);
    setMoradoresCount(novoTotal);
    toggleApoiarPost(post.id);

    try {
      if (currentUser?.id) {
        await supabase.rpc('toggle_apoiar_post', {
          p_post_id: post.id,
          p_user_id: currentUser.id,
        });
      }
    } catch (err) {
      console.warn('Sincronização com Supabase RPC falhou (usando estado local):', err);
    } finally {
      setIsUpdatingApoio(false);
    }
  };

  // Imagem fidedigna de zeladoria urbana
  const fotoUrlRealista =
    post.foto_url && !post.foto_url.includes('photo-1515162816999')
      ? post.foto_url
      : 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=800&q=80';

  // Dados do usuário
  const user = post.user;
  const nomeExibicao = user?.nome_completo || 'Morador(a)';
  const bairroExibicao = user?.bairro || post.bairro;
  const nivelVerificacao = user?.nivel_verificacao ?? 1;

  return (
    <article className="bg-white max-w-md mx-auto pb-4 border-b border-gray-100 transition-colors">
      {/* Header do Autor */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center space-x-2.5">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            <Image
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80'
              }
              alt={nomeExibicao}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-gray-900 leading-tight">
                {nomeExibicao}
              </span>
              <span className="text-xs font-semibold text-gray-900 leading-tight">
                (Morador(a) do {bairroExibicao})
              </span>
            </div>
            <div className="flex items-center space-x-1 mt-0.5">
              {nivelVerificacao >= 2 && (
                <>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#1ea751] text-white flex items-center justify-center text-[9px] font-black">
                    <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                  </span>
                  <span className="text-[10px] text-[#0d9488] font-bold">Cidadão Verificado</span>
                </>
              )}
              {nivelVerificacao === 1 && (
                <span className="text-[10px] text-gray-500 font-medium">Cadastrado</span>
              )}
              {nivelVerificacao === 0 && (
                <span className="text-[10px] text-gray-400 font-medium">Visitante</span>
              )}
            </div>
          </div>
        </div>

        <button className="text-gray-400 hover:text-gray-600 p-1" aria-label="Opções">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Foto do Problema de Zeladoria */}
      <div className="relative w-full aspect-[4/3] bg-neutral-100 overflow-hidden">
        <Image
          src={fotoUrlRealista}
          alt="Problema de zeladoria reportado"
          fill
          className="object-cover"
          sizes="(max-width: 480px) 100vw, 448px"
          priority
        />
        {/* Selo de Protocolo Oficial sobre a foto */}
        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-sm border border-white/10">
          <FileText className="w-3 h-3 text-emerald-400" />
          <span>Protocolo 156: #{post.numero_protocolo}</span>
        </div>
      </div>

      {/* BANNER DE IMPACTO COLETIVO & ANTI-DUPLICAÇÃO: "Também me afeta (+1)" */}
      <div className="mx-3.5 mt-2.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <div>
            <span className="text-xs font-black text-amber-950 block leading-tight">
              {moradoresCount} {moradoresCount === 1 ? 'morador afetado' : 'moradores afetados'}
            </span>
            <span className="text-[10px] text-amber-800">Prioridade coletiva na Prefeitura</span>
          </div>
        </div>

        <button
          onClick={handleToggleAfeta}
          disabled={isUpdatingApoio}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 ${
            apoiado
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-white text-gray-800 border border-gray-300 hover:border-emerald-500 hover:text-emerald-700'
          }`}
          title="Clique para somar seu apoio a este chamado e evitar chamados duplicados"
        >
          {apoiado ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Você apoiou (+1)</span>
            </>
          ) : (
            <>
              <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Também me afeta (+1)</span>
            </>
          )}
        </button>
      </div>

      {/* Barra de Interações (estilo Instagram) */}
      <div className="flex items-center justify-between px-3.5 pt-2 pb-1">
        <div className="flex items-center space-x-4 text-gray-900">
          <button
            onClick={handleLike}
            aria-label="Curtir"
            className={`transition-colors active:scale-125 ${liked ? 'text-red-500 fill-red-500' : 'hover:text-red-500'}`}
          >
            <Heart className={`w-6 h-6 stroke-[1.8] ${liked ? 'fill-current' : ''}`} />
          </button>
          <button aria-label="Comentar" className="hover:text-gray-600 transition-colors">
            <MessageCircle className="w-6 h-6 stroke-[1.8]" />
          </button>
          <button aria-label="Compartilhar" className="hover:text-gray-600 transition-colors">
            <Send className="w-5 h-5 -rotate-45 stroke-[1.8]" />
          </button>
        </div>

        <button aria-label="Salvar" className="text-gray-900 hover:text-gray-600 transition-colors">
          <Bookmark className="w-6 h-6 stroke-[1.8]" />
        </button>
      </div>

      {/* Descrição e Protocolo */}
      <div className="px-3.5 py-1 space-y-1.5 text-xs text-gray-900">
        <p className="leading-snug">
          {post.descricao}
        </p>

        {/* Hashtags dinâmicas */}
        <p className="text-[11px] text-gray-800 font-medium space-x-1.5">
          <span className="hover:underline cursor-pointer">#ZeladoriaUrbana</span>
          <span className="hover:underline cursor-pointer">#{bairroExibicao.toLowerCase().replace(/\s+/g, '')}</span>
          <span className="hover:underline cursor-pointer">#{post.categoria}</span>
        </p>

        {/* Contadores */}
        <div className="flex items-center space-x-3 pt-1 text-xs text-gray-500 font-medium">
          <div className="flex items-center space-x-1">
            <Heart className="w-3.5 h-3.5 stroke-[2] fill-transparent" />
            <span>{post.curtidas + (liked ? 1 : 0)} curtidas</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-3.5 h-3.5 stroke-[2]" />
            <span>0 comentários</span>
          </div>
        </div>
      </div>
    </article>
  );
};
