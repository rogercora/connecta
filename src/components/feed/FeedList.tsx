'use client';

import React from 'react';
import { FeedLevel } from '@/types/feed';
import { PautaIACard } from './PautaIACard';
import { PostComunidadeCard } from './PostComunidadeCard';
import { CidadeEsperaView } from './CidadeEsperaView';
import { usePautas, usePosts, useCidadeStatus } from '@/hooks/useFeedReal';
import { useAuthStore } from '@/stores/authStore';

interface FeedListProps {
  feedLevel: FeedLevel;
  onSwitchTab?: (tab: FeedLevel) => void;
}

export const FeedList: React.FC<FeedListProps> = ({ feedLevel, onSwitchTab }) => {
  const user = useAuthStore((s) => s.user);
  const userCidade = user?.cidade || 'São José dos Campos';
  const userEstado = user?.estado || 'SP';
  const userBairro = user?.bairro || 'Jardim Aquárius';

  // Verifica se a cidade do usuário está liberada (ativa) ou em espera
  const { data: cidadeStatus, isLoading: loadingStatus } = useCidadeStatus(userCidade, userEstado);

  // Busca pautas e posts reais
  const { data: pautas = [], isLoading: loadingPautas, isError: errorPautas } = usePautas(
    feedLevel,
    userCidade,
    userBairro
  );
  const { data: posts = [], isLoading: loadingPosts, isError: errorPosts } = usePosts(
    feedLevel,
    userCidade,
    userBairro
  );

  // Se o usuário está em uma cidade em lista de espera e navegando no nível local/municipal
  if (
    !loadingStatus &&
    cidadeStatus &&
    !cidadeStatus.is_liberada &&
    (feedLevel === 'bairro' || feedLevel === 'cidade')
  ) {
    return (
      <CidadeEsperaView
        cidadeStatus={cidadeStatus}
        onExplorarFederal={() => onSwitchTab?.('federal')}
      />
    );
  }

  if (loadingPautas || loadingPosts) {
    return (
      <div className="w-full max-w-md mx-auto py-16 flex flex-col items-center justify-center space-y-3 text-gray-500">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-gray-600">Carregando feed de {userCidade}...</span>
      </div>
    );
  }

  if (errorPautas && errorPosts) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 text-center">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs space-y-1">
          <p className="font-bold">Não foi possível conectar ao Supabase</p>
          <p className="text-[11px] text-amber-700">Verifique sua conexão ou credenciais do projeto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto divide-y divide-gray-100 bg-white min-h-screen">
      {/* 1. Cards de Pauta com IA */}
      {pautas.map((pauta) => (
        <PautaIACard key={pauta.id} pauta={pauta} />
      ))}

      {/* 2. Posts da Comunidade */}
      {posts.map((post) => (
        <PostComunidadeCard key={post.id} post={post} />
      ))}

      {pautas.length === 0 && posts.length === 0 && (
        <div className="p-8 text-center text-xs text-gray-400">
          Nenhuma pauta ou postagem encontrada para este nível territorial.
        </div>
      )}
    </div>
  );
};
