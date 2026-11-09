'use client';

import { create } from 'zustand';
import { User, NivelVerificacao } from '@/types/database';

export const MOCK_USER: User = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  phone: '12987654321',
  email: 'maria.sjc@exemplo.com',
  nome_completo: 'Maria Silva',
  avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
  cep: '12246-021',
  bairro: 'Jardim Aquárius',
  cidade: 'São José dos Campos',
  estado: 'SP',
  coordenadas: { lat: -23.2085, lng: -45.9085 },
  nivel_verificacao: 2, // Cidadã Verificada
  cpf_hash: 'hash_cpf_maria_sjc_123',
  created_at: new Date().toISOString(),
};

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setNivelVerificacao: (nivel: NivelVerificacao) => void;
  setLocalizacao: (dados: { cidade: string; estado: string; bairro: string; cep: string }) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: MOCK_USER,
  isAuthenticated: true,
  login: async (_email, _pass) => {
    set({ user: MOCK_USER, isAuthenticated: true });
    return true;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  setNivelVerificacao: (nivel) => {
    set((state) => ({
      user: state.user ? { ...state.user, nivel_verificacao: nivel } : null,
    }));
  },
  setLocalizacao: ({ cidade, estado, bairro, cep }) => {
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            cidade,
            estado,
            bairro,
            cep,
          }
        : null,
    }));
  },
}));
