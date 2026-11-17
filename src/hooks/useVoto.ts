'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

interface UserVotoRecord {
  pauta_id: string;
  opcao_voto: 'concordar' | 'discordar';
  motivo_discordancia: string | null;
  created_at?: string;
}

export function useVoto(
  pautaId: string,
  initialConcordar: number = 0,
  initialDiscordar: number = 0
) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [concordarCount, setConcordarCount] = useState<number>(initialConcordar);
  const [discordarCount, setDiscordarCount] = useState<number>(initialDiscordar);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Busca todos os votos do usuário em 1 única requisição compartilhada em cache
  const { data: userVotosMap = {} } = useQuery<Record<string, UserVotoRecord>>({
    queryKey: ['user_votos', user?.id ?? 'guest'],
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await fetch('/api/votos');
      if (!res.ok) return {};
      const data = await res.json();
      const map: Record<string, UserVotoRecord> = {};
      for (const v of data.votos || []) {
        map[v.pauta_id] = v;
      }
      return map;
    },
  });

  const existingVote = user?.id ? userVotosMap[pautaId] : undefined;
  const hasVoted = Boolean(existingVote);
  const userVote = existingVote?.opcao_voto ?? null;
  const userMotivo = existingVote?.motivo_discordancia ?? null;

  useEffect(() => {
    setConcordarCount(initialConcordar);
    setDiscordarCount(initialDiscordar);
  }, [initialConcordar, initialDiscordar]);

  const submitVote = async (opcao: 'concordar' | 'discordar', motivo?: string): Promise<boolean> => {
    setVoteError(null);

    if (!user?.id) {
      setVoteError('Faça login para registrar seu voto nesta pauta.');
      return false;
    }

    if ((user.nivel_verificacao ?? 0) < 2) {
      setVoteError('Apenas cidadãos verificados (Nível 2) podem votar nas decisões da Câmara.');
      return false;
    }

    if (hasVoted || isSubmitting) return false;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/votos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pauta_id: pautaId,
          opcao_voto: opcao,
          motivo_discordancia: motivo || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409 && data.already_voted) {
          void queryClient.invalidateQueries({ queryKey: ['user_votos', user.id] });
          if (typeof data.contadores?.votos_concordar === 'number') {
            setConcordarCount(data.contadores.votos_concordar);
          }
          if (typeof data.contadores?.votos_discordar === 'number') {
            setDiscordarCount(data.contadores.votos_discordar);
          }
        }
        setVoteError(data.error || 'Não foi possível registrar seu voto.');
        return false;
      }

      queryClient.setQueryData<Record<string, UserVotoRecord>>(
        ['user_votos', user.id],
        (prev = {}) => ({
          ...prev,
          [pautaId]: {
            pauta_id: pautaId,
            opcao_voto: opcao,
            motivo_discordancia: motivo || null,
            created_at: new Date().toISOString(),
          },
        })
      );

      if (typeof data.contadores?.votos_concordar === 'number') {
        setConcordarCount(data.contadores.votos_concordar);
      }
      if (typeof data.contadores?.votos_discordar === 'number') {
        setDiscordarCount(data.contadores.votos_discordar);
      }

      void queryClient.invalidateQueries({ queryKey: ['pautas'] });

      return true;
    } catch {
      setVoteError('Falha de conexão ao registrar voto. Tente novamente.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    hasVoted,
    userVote,
    userMotivo,
    concordarCount,
    discordarCount,
    totalVotos: concordarCount + discordarCount,
    isSubmitting,
    voteError,
    isAuthenticated: Boolean(user?.id),
    canVote: (user?.nivel_verificacao ?? 0) >= 2,
    submitVote,
  };
}
