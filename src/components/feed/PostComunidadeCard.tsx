'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, Check } from 'lucide-react';
import { PostComunidade } from '@/types/database';
import { useFeedStore } from '@/stores/feedStore';

interface PostComunidadeCardProps {
  post: PostComunidade;
}

export const PostComunidadeCard: React.FC<PostComunidadeCardProps> = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const curtirPost = useFeedStore((s) => s.curtirPost);

  const handleLike = () => {
    if (!liked) {
      curtirPost(post.id);
      setLiked(true);
    } else {
      setLiked(false);
    }
  };

  // Imagem fidedigna de buraco em asfalto urbano
  const fotoUrlRealista =
    post.foto_url && !post.foto_url.includes('photo-1515162816999')
      ? post.foto_url
      : 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=800&q=80';

  return (
    <article className="bg-white max-w-md mx-auto pb-4 border-b border-gray-100">
      {/* Header do Autor */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center space-x-2.5">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            <Image
              src={
                post.user?.avatar_url ||
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80'
              }
              alt={post.user?.nome_completo || 'Maria Silva'}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-gray-900 leading-tight">
                {post.user?.nome_completo || 'Maria Silva'}
              </span>
              <span className="text-xs font-semibold text-gray-900 leading-tight">
                (Moradora do {post.bairro})
              </span>
            </div>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#1ea751] text-white flex items-center justify-center text-[9px] font-black">
                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
              </span>
              <span className="text-[10px] text-[#0d9488] font-bold">Verificado</span>
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
          alt="Buraco no asfalto reportado"
          fill
          className="object-cover"
          sizes="(max-width: 480px) 100vw, 448px"
          priority
        />
      </div>

      {/* Barra de Interações (estilo Instagram) */}
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1">
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
          <span>Gente, esse buraco na Rua Agostinho Gomes está enorme! </span>
          <span className="font-semibold text-gray-900">
            Já protocolado na Prefeitura (nº {post.numero_protocolo}).
          </span>
        </p>

        {/* Hashtags */}
        <p className="text-[11px] text-gray-800 font-medium space-x-1.5">
          <span className="hover:underline cursor-pointer">#ZeladoriaUrbana</span>
          <span className="hover:underline cursor-pointer">#ipiranga</span>
        </p>

        {/* Contadores */}
        <div className="flex items-center space-x-3 pt-1 text-xs text-gray-500 font-medium">
          <div className="flex items-center space-x-1">
            <Heart className="w-3.5 h-3.5 stroke-[2] fill-transparent" />
            <span>{post.curtidas + (liked ? 1 : 0)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-3.5 h-3.5 stroke-[2]" />
            <span>8</span>
          </div>
        </div>
      </div>
    </article>
  );
};
