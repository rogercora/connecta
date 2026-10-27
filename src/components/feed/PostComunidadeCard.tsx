'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="bg-white border-b border-gray-100 max-w-md mx-auto shadow-sm pb-2">
      {/* Header do Autor */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2.5">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-200">
            {post.user?.avatar_url ? (
              <Image
                src={post.user.avatar_url}
                alt={post.user.nome_completo || 'Cidadão'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-xs">
                MS
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-gray-900">
                {post.user?.nome_completo || 'Maria Silva'}
              </span>
              <span className="text-xs font-semibold text-gray-700">
                (Moradora do {post.bairro})
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-teal-600 font-medium">
              <CheckCircle2 className="w-3 h-3 fill-teal-500 text-white" />
              <span>Verificado</span>
            </div>
          </div>
        </div>

        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Mídia do Problema (Foto do feed) */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {post.foto_url ? (
          <Image
            src={post.foto_url}
            alt="Problema reportado"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Foto do local
          </div>
        )}
      </div>

      {/* Barra de Interações (Instagram-style) */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-gray-800 hover:text-red-500'}`}
          >
            <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
          </button>
          <button className="text-gray-800 hover:text-gray-600">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="text-gray-800 hover:text-gray-600">
            <Send className="w-5 h-5 -rotate-45" />
          </button>
        </div>

        <button className="text-gray-800 hover:text-gray-600">
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* Descrição e Protocolo */}
      <div className="px-3 py-1 space-y-1.5 text-xs text-gray-900 leading-snug">
        <p>
          <span>Gente, esse buraco na Rua Agostinho Gomes está enorme! </span>
          <span className="font-semibold text-gray-900">
            Já protocolado na Prefeitura (nº {post.numero_protocolo}).
          </span>
        </p>

        {/* Hashtags em destaque */}
        <p className="text-[11px] text-gray-700 font-medium space-x-1">
          <span className="hover:underline cursor-pointer">#ZeladoriaUrbana</span>
          <span className="hover:underline cursor-pointer">#ipiranga</span>
        </p>

        {/* Contadores */}
        <div className="flex items-center space-x-4 pt-1 text-xs text-gray-600 font-medium">
          <div className="flex items-center space-x-1">
            <Heart className="w-3.5 h-3.5 text-gray-500" />
            <span>{post.curtidas + (liked ? 1 : 0)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-3.5 h-3.5 text-gray-500" />
            <span>8</span>
          </div>
        </div>
      </div>
    </div>
  );
};

