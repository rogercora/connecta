'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { PautaIA, PostComunidade } from '@/types/database';
import { FeedLevel } from '@/types/feed';

export function usePautas(feedLevel: FeedLevel) {
  return useQuery({
    queryKey: ['pautas', feedLevel],
    queryFn: async () => {
      let query = supabase
        .from('pautas_ia')
        .select('*')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false });

      if (feedLevel === 'bairro') {
        query = query.eq('bairro_alvo', 'Ipiranga');
      } else if (feedLevel === 'cidade') {
        query = query.eq('cidade_alvo', 'São Paulo');
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao buscar pautas no Supabase:', error);
        throw error;
      }
      return (data ?? []) as PautaIA[];
    },
    retry: 1,
    staleTime: 1000 * 60,
  });
}

export function usePosts(feedLevel: FeedLevel) {
  return useQuery({
    queryKey: ['posts', feedLevel],
    queryFn: async () => {
      let query = supabase
        .from('posts_comunidade')
        .select(`
          *,
          user:users(nome_completo, avatar_url, bairro, cidade, estado, nivel_verificacao)
        `)
        .order('created_at', { ascending: false });

      if (feedLevel === 'bairro') {
        query = query.eq('bairro', 'Ipiranga');
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao buscar posts no Supabase:', error);
        throw error;
      }
      return (data ?? []) as (PostComunidade & { user: any })[];
    },
    retry: 1,
    staleTime: 1000 * 60,
  });
}
