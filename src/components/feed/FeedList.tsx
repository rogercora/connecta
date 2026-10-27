'use client';

import React from 'react';
import { FeedLevel } from '@/types/feed';
import { PautaIACard } from './PautaIACard';
import { PostComunidadeCard } from './PostComunidadeCard';
import { useFeedStore } from '@/stores/feedStore';

interface FeedListProps {
  feedLevel: FeedLevel;
}

export const FeedList: React.FC<FeedListProps> = ({ feedLevel }) => {
  const pautas = useFeedStore((s) => s.pautas);
  const posts = useFeedStore((s) => s.posts);

  return (
    <div className="w-full max-w-md mx-auto divide-y divide-gray-100 bg-white min-h-screen">
      {/* 1. Card de Alerta de IA no topo */}
      {pautas.map((pauta) => (
        <PautaIACard key={pauta.id} pauta={pauta} />
      ))}

      {/* 2. Posts da Comunidade abaixo */}
      {posts.map((post) => (
        <PostComunidadeCard key={post.id} post={post} />
      ))}

      {feedLevel !== 'bairro' && (
        <div className="p-8 text-center text-xs text-gray-400">
          Você está navegando no feed {feedLevel === 'cidade' ? 'Municipal' : 'Federal'}.
          Pautas adicionais em processamento pela IA pública.
        </div>
      )}
    </div>
  );
};

