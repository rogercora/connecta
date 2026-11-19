'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { PautaIA, PostComunidade } from '@/types/database';
import { FeedLevel } from '@/types/feed';
import { CidadeStatusData } from '@/components/feed/CidadeEsperaView';

export function useCidadeStatus(cidade: string, estado: string) {
  return useQuery<CidadeStatusData>({
    queryKey: ['cidade_status', cidade, estado],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_or_create_cidade_espera', {
        p_nome: cidade,
        p_estado: estado,
      });

      if (error) {
        console.error('Erro ao verificar status da cidade no Supabase:', error);
        // Fallback resiliente
        const isSJC = cidade.toLowerCase().includes('josé dos campos');
        return {
          cidade,
          estado,
          status: isSJC ? 'ativa' : 'em_espera',
          is_liberada: isSJC,
          total_cadastrados: isSJC ? 1000 : 42,
          meta_usuarios: isSJC ? 1000 : 500,
          faltam: isSJC ? 0 : 458,
          porcentagem: isSJC ? 100 : 8,
        };
      }

      return data as CidadeStatusData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function usePautas(
  feedLevel: FeedLevel,
  userCidade: string = 'São José dos Campos',
  userBairro: string = 'Jardim Aquárius'
) {
  return useQuery({
    queryKey: ['pautas', feedLevel, userCidade, userBairro],
    queryFn: async () => {
      let query = supabase
        .from('pautas_ia')
        .select('*')
        .in('status', ['ativa', 'peticao_gerada'])
        .order('created_at', { ascending: false });

      if (feedLevel === 'bairro') {
        // No feed de bairro: prioriza pautas do bairro do morador, Centro, Geral ou de toda a cidade
        query = query.or(
          `bairro_alvo.ilike.%${userBairro}%,bairro_alvo.ilike.%Geral%,bairro_alvo.ilike.%Toda a Cidade%,bairro_alvo.ilike.%Centro%,cidade_alvo.ilike.%${userCidade}%`
        );
      } else if (feedLevel === 'cidade') {
        query = query.ilike('cidade_alvo', `%${userCidade}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao buscar pautas no Supabase:', error);
        throw error;
      }

      return (data ?? []) as PautaIA[];
    },
    retry: 1,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function usePosts(feedLevel: FeedLevel, userCidade: string = 'São José dos Campos', userBairro: string = 'Jardim Aquárius') {
  return useQuery({
    queryKey: ['posts', feedLevel, userCidade, userBairro],
    queryFn: async () => {
      const selectFields = `
        *,
        user:perfis_publicos(nome_completo, avatar_url, bairro, cidade, estado, nivel_verificacao),
        comentarios(count)
      `;

      const runQuery = async (applyCity: boolean, applyBairro: boolean) => {
        let q = supabase
          .from('posts_comunidade')
          .select(selectFields)
          .order('created_at', { ascending: false });

        if (applyCity && userCidade && feedLevel !== 'federal') {
          q = q.ilike('cidade', `%${userCidade}%`);
        }
        if (applyBairro && userBairro) {
          q = q.ilike('bairro', `%${userBairro}%`);
        }
        return await q;
      };

      let result = await runQuery(feedLevel !== 'federal', feedLevel === 'bairro');
      if (result.error && result.error.message?.includes('cidade')) {
        // Fallback compatível caso migration Sprint 2 ainda não tenha rodado
        let qFallback = supabase
          .from('posts_comunidade')
          .select(selectFields)
          .order('created_at', { ascending: false });
        if (feedLevel === 'bairro' && userBairro) {
          qFallback = qFallback.ilike('bairro', `%${userBairro}%`);
        }
        result = await qFallback;
      }

      if (result.error) {
        console.error('Erro ao buscar posts no Supabase:', result.error);
        throw result.error;
      }

      let rawPosts = result.data ?? [];

      // Fallback amigável se no bairro específico não houver ocorrência ainda (restringindo à cidade)
      if (feedLevel === 'bairro' && rawPosts.length === 0) {
        const cityOnly = await runQuery(true, false);
        if (!cityOnly.error && cityOnly.data) {
          rawPosts = cityOnly.data;
        }
      }

      // Enriquecer com curtidas e apoios do usuário logado
      const curtidosSet = new Set<string>();
      const apoiadosSet = new Set<string>();
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser && rawPosts.length > 0) {
          const ids = rawPosts.map((p: any) => p.id);
          const [{ data: curtidasRows }, { data: apoiosRows }] = await Promise.all([
            supabase.from('post_curtidas').select('post_id').eq('user_id', authUser.id).in('post_id', ids),
            supabase.from('post_apoios').select('post_id').eq('user_id', authUser.id).in('post_id', ids),
          ]);
          for (const c of curtidasRows ?? []) curtidosSet.add(c.post_id);
          for (const a of apoiosRows ?? []) apoiadosSet.add(a.post_id);
        }
      } catch {
        // Ignora silenciosamente se não autenticado ou tabela em rollout
      }

      return rawPosts.map((p: any) => ({
        ...p,
        comentarios_count: Array.isArray(p.comentarios) ? Number(p.comentarios[0]?.count ?? 0) : 0,
        user_ja_curtiu: curtidosSet.has(p.id),
        user_ja_apoiou: apoiadosSet.has(p.id),
      })) as (PostComunidade & { user: any })[];
    },
    retry: 1,
    staleTime: 1000 * 60,
  });
}
