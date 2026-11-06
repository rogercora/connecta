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

      // Filtro por nível do feed
      if (feedLevel === 'bairro') {
        // TODO: pegar CEP do usuário logado via auth
        // query = query.eq('cep_alvo', userCep);
      } else if (feedLevel === 'cidade') {
        // query = query.eq('cidade_alvo', userCidade);
      }
      // federal: sem filtro adicional

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PautaIA[];
    },
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
        // TODO: filtrar por CEP do usuário
      } else if (feedLevel === 'cidade') {
        // query = query.eq('cidade', userCidade);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as (PostComunidade & { user: any })[];
    },
  });
}
