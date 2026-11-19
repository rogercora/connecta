'use client';

import React from 'react';
import Link from 'next/link';
import { Megaphone, Camera, Sparkles, MapPin } from 'lucide-react';
import { FeedLevel } from '@/types/feed';
import { PostComunidadeCard } from './PostComunidadeCard';
import { CidadeEsperaView } from './CidadeEsperaView';
import { usePosts, useCidadeStatus } from '@/hooks/useFeedReal';
import { useAuthStore } from '@/stores/authStore';
import { useFeedStore } from '@/stores/feedStore';

interface FeedListProps {
  feedLevel: FeedLevel;
  onSwitchTab?: (tab: FeedLevel) => void;
}

export const FeedList: React.FC<FeedListProps> = ({ feedLevel, onSwitchTab }) => {
  const user = useAuthStore((s) => s.user);
  const searchQuery = useFeedStore((s) => s.searchQuery);
  const setSearchQuery = useFeedStore((s) => s.setSearchQuery);
  const userCidade = user?.cidade || 'São José dos Campos';
  const userEstado = user?.estado || 'SP';
  const userBairro = user?.bairro || 'Jardim Aquárius';

  // Verifica se a cidade do usuário está liberada (ativa) ou em espera
  const { data: cidadeStatus, isLoading: loadingStatus } = useCidadeStatus(userCidade, userEstado);

  // Busca apenas postagens reais da comunidade de moradores
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

  if (loadingPosts) {
    return (
      <div className="w-full max-w-md mx-auto py-16 flex flex-col items-center justify-center space-y-3 text-gray-500">
        <div className="w-6 h-6 border-2 border-crimson-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-gray-600">Carregando relatos dos moradores de {userCidade}...</span>
      </div>
    );
  }

  if (errorPosts) {
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
      {/* Banner Informativo Cívico (Redirecionando Decisões da Câmara para Ações) */}
      <div className="p-3 bg-crimson-50/70 border-b border-crimson-100 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-crimson-900 font-medium">
          <Megaphone className="w-4 h-4 text-crimson-600 shrink-0" />
          <span>Quer votar nas leis e contratos da Câmara?</span>
        </div>
        <Link
          href="/acoes"
          className="font-bold text-crimson-700 hover:text-crimson-800 hover:underline shrink-0 text-xs flex items-center gap-1"
        >
          Ir para Ações →
        </Link>
      </div>

      {searchQuery.trim() && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-950">
          <span>
            Filtrando por: <strong>&ldquo;{searchQuery}&rdquo;</strong>
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="font-bold text-crimson-700 hover:underline"
          >
            Limpar
          </button>
        </div>
      )}

      {/* Posts da Comunidade de Moradores */}
      {posts
        .filter((post) => {
          const q = searchQuery.trim().toLowerCase();
          if (!q) return true;
          const hay = `${post.descricao || ''} ${post.bairro || ''} ${post.categoria || ''} ${post.numero_protocolo || ''} ${post.user?.nome_completo || ''}`.toLowerCase();
          return hay.includes(q);
        })
        .map((post) => (
          <PostComunidadeCard key={post.id} post={post} />
        ))}

      {posts.length === 0 && (
        <div className="p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900">Mural do Bairro sem postagens</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Seja o primeiro a fiscalizar! Use o botão vermelho &ldquo;Cobrar&rdquo; para registrar buracos, iluminação ou zeladoria urbana.
            </p>
          </div>
          <Link
            href="/postar"
            className="inline-flex items-center justify-center rounded-full bg-crimson-600 px-5 py-2.5 text-xs font-bold text-white shadow-crimson-btn hover:bg-crimson-700 transition-colors"
          >
            Cobrar Zeladoria Agora
          </Link>
        </div>
      )}
    </div>
  );
};
