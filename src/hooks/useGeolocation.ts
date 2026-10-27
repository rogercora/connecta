'use client';

import { useState } from 'react';

export interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [endereco, setEndereco] = useState<EnderecoViaCEP | null>(null);

  const buscarCEP = async (cepInput: string) => {
    const cleanCEP = cepInput.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return null;

    setLoading(true);
    try {
      // Mock inteligente para resposta instantânea ou fallback para viacep
      if (cleanCEP === '04266000') {
        const mockResult: EnderecoViaCEP = {
          cep: '04266-000',
          logradouro: 'Rua Silva Bueno',
          bairro: 'Ipiranga',
          localidade: 'São Paulo',
          uf: 'SP',
        };
        setEndereco(mockResult);
        return mockResult;
      }

      const res = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEndereco(data);
        return data as EnderecoViaCEP;
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
    return null;
  };

  return { buscarCEP, endereco, loading };
}

