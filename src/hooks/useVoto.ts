'use client';

import { useState } from 'react';
import { useAuth } from './useAuth';
import { useFeedStore } from '@/stores/feedStore';

export function useVoto(pautaId: string) {
  const { isNivel2 } = useAuth();
  const votarPauta = useFeedStore((s) => s.votarPauta);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [userVote, setUserVote] = useState<'concordar' | 'discordar' | null>(null);

  const submitVote = (opcao: 'concordar' | 'discordar', motivo?: string) => {
    if (!isNivel2) {
      alert('Apenas Cidadãos Verificados (Nível 2) podem votar diretamente em pautas de lei. Envie seu comprovante de residência!');
      return false;
    }
    if (hasVoted) return false;

    votarPauta(pautaId, opcao);
    setHasVoted(true);
    setUserVote(opcao);
    if (motivo) {
      console.log('Motivo da discordância registrado:', motivo);
    }
    return true;
  };

  return {
    hasVoted,
    userVote,
    submitVote,
  };
}

