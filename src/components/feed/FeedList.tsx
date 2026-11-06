'use client';

import React from 'react';
import { FeedLevel } from '@/types/feed';
import { PautaIACard } from './PautaIACard';
import { PostComunidadeCard } from './PostComunidadeCard';
import { usePautas, usePosts } from '@/hooks/useFeedReal';

interface FeedListProps {
  feedLevel: FeedLevel;
}

export const FeedList: React.FC<FeedListProps> = ({ feedLevel }) => {
  const { data: pautas = [], isLoading: loadingPautas } = usePautas(feedLevel);
  const { data: posts = [], isLoading: loadingPosts } = usePosts(feedLevel);

  if (loadingPautas || loadingPosts) {
    return (
      <div className="w-full max-w-md mx-auto py-8 text-center text-gray-500">
        Carregando feed...
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto divide-y divide-gray-100 bg-white min-h-screen">
      {pautas.map((pauta) => (
        <PautaIACard key={pauta.id} pauta={pauta} />
      ))}
      {posts.map((post) => (
        <PostComunidadeCard key={post.id} post={post} />
      ))}

      {pautas.length === 0 && posts.length === 0 && (
        <div className="p-8 text-center text-xs text-gray-400">
          Nenhuma pauta ou postagem no momento.
        </div>
      )}
    </div>
  );
};
