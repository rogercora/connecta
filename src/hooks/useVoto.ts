'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useFeedStore } from '@/stores/feedStore';

export interface VotoInfo {
  opcao: 'concordar' | 'discordar';
  motivo?: string;
  timestamp: string;
}

export function useVoto(
  pautaId: string,
  initialConcordar: number = 0,
  initialDiscordar: number = 0
) {
  const user = useAuthStore((s) => s.user);
  const votarPautaStore = useFeedStore((s) => s.votarPauta);

  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [userVote, setUserVote] = useState<'concordar' | 'discordar' | null>(null);
  const [userMotivo, setUserMotivo] = useState<string | null>(null);
  const [concordarCount, setConcordarCount] = useState<number>(initialConcordar);
  const [discordarCount, setDiscordarCount] = useState<number>(initialDiscordar);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Inicializa voto a partir de localStorage e verifica persistência
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedVotes = localStorage.getItem('conectabr_user_votes');
      if (savedVotes) {
        const parsed: Record<string, VotoInfo> = JSON.parse(savedVotes);
        if (parsed[pautaId]) {
          setHasVoted(true);
          setUserVote(parsed[pautaId].opcao);
          setUserMotivo(parsed[pautaId].motivo || null);
        }
      }
    } catch (e) {
      console.warn('Erro ao ler votos locais:', e);
    }
  }, [pautaId]);

  // Atualiza contadores caso a pauta inicial mude
  useEffect(() => {
    setConcordarCount(initialConcordar);
    setDiscordarCount(initialDiscordar);
  }, [initialConcordar, initialDiscordar]);

  const submitVote = async (opcao: 'concordar' | 'discordar', motivo?: string) => {
    if (hasVoted || isSubmitting) return false;

    setIsSubmitting(true);

    // Otimista na UI
    setHasVoted(true);
    setUserVote(opcao);
    if (motivo) setUserMotivo(motivo);

    if (opcao === 'concordar') {
      setConcordarCount((c) => c + 1);
    } else {
      setDiscordarCount((d) => d + 1);
    }

    // Atualiza na store do feed
    votarPautaStore(pautaId, opcao);

    // Salva no localStorage para persistência imediata e offline-first
    if (typeof window !== 'undefined') {
      try {
        const savedVotes = localStorage.getItem('conectabr_user_votes');
        const votesObj: Record<string, VotoInfo> = savedVotes ? JSON.parse(savedVotes) : {};
        votesObj[pautaId] = {
          opcao,
          motivo,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('conectabr_user_votes', JSON.stringify(votesObj));
      } catch (err) {
        console.warn('Erro ao salvar voto no localStorage:', err);
      }
    }

    // Persiste no backend via API / Supabase
    try {
      const res = await fetch('/api/votos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pauta_id: pautaId,
          user_id: user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          opcao_voto: opcao,
          motivo_discordancia: motivo || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.contadores?.votos_concordar) {
          setConcordarCount(data.contadores.votos_concordar);
        }
        if (data.contadores?.votos_discordar) {
          setDiscordarCount(data.contadores.votos_discordar);
        }
      }
    } catch (err) {
      console.warn('Falha na requisição /api/votos, mantido otimista local:', err);
    } finally {
      setIsSubmitting(false);
    }

    return true;
  };

  return {
    hasVoted,
    userVote,
    userMotivo,
    concordarCount,
    discordarCount,
    totalVotos: concordarCount + discordarCount,
    isSubmitting,
    submitVote,
  };
}

