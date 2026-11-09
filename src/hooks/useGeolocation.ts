'use client';

import { useState } from 'react';

export interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  isSJC?: boolean;
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [endereco, setEndereco] = useState<EnderecoViaCEP | null>(null);

  const buscarCEP = async (cepInput: string) => {
    const cleanCEP = cepInput.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return null;

    setLoading(true);
    try {
      // Mock instantâneo para CEPs frequentes de teste
      if (cleanCEP === '12246021') {
        const mockResult: EnderecoViaCEP = {
          cep: '12246-021',
          logradouro: 'Avenida Cassiano Ricardo',
          bairro: 'Jardim Aquárius',
          localidade: 'São José dos Campos',
          uf: 'SP',
          isSJC: true,
        };
        setEndereco(mockResult);
        return mockResult;
      }

      if (cleanCEP === '12230000') {
        const mockResult: EnderecoViaCEP = {
          cep: '12230-000',
          logradouro: 'Avenida Andrômeda',
          bairro: 'Jardim Satélite',
          localidade: 'São José dos Campos',
          uf: 'SP',
          isSJC: true,
        };
        setEndereco(mockResult);
        return mockResult;
      }

      if (cleanCEP === '12308000') {
        const mockResult: EnderecoViaCEP = {
          cep: '12308-000',
          logradouro: 'Praça dos Três Poderes',
          bairro: 'Centro',
          localidade: 'Jacareí',
          uf: 'SP',
          isSJC: false,
        };
        setEndereco(mockResult);
        return mockResult;
      }

      const res = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const isSJC =
          data.localidade?.toLowerCase().includes('josé dos campos') ||
          (cleanCEP >= '12200000' && cleanCEP <= '12249999');

        const resultado: EnderecoViaCEP = {
          ...data,
          isSJC,
        };
        setEndereco(resultado);
        return resultado;
      }
    } catch (e) {
      console.error('Erro na consulta do CEP:', e);
    } finally {
      setLoading(false);
    }
    return null;
  };

  return { buscarCEP, endereco, loading };
}
