'use client';

import { create } from 'zustand';
import { User, NivelVerificacao } from '@/types/database';

export const MOCK_USER: User = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  phone: '11987654321',
  email: 'maria.silva@exemplo.com',
  nome_completo: 'Maria Silva',
  avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
  cep: '04266-000',
  bairro: 'Ipiranga',
  cidade: 'São Paulo',
  estado: 'SP',
  coordenadas: { lat: -23.5908, lng: -46.6022 },
  nivel_verificacao: 2, // Cidadã Verificada
  cpf_hash: 'hash_cpf_maria_ipiranga_123',
  created_at: new Date().toISOString(),
};

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setNivelVerificacao: (nivel: NivelVerificacao) => void;
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
}));

