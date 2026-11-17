'use client';

import { create } from 'zustand';
import { User } from '@/types/database';
import { supabase } from '@/lib/supabase/client';

export interface LoginResult {
  ok: boolean;
  error?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  refreshProfile: () => Promise<User | null>;
  login: (email: string, pass: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

let inflightProfilePromise: Promise<User | null> | null = null;

function mapSupabaseAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirme seu e-mail através do link enviado antes de entrar.';
  }
  if (lower.includes('too many requests')) {
    return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
  }
  return message;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  refreshProfile: async () => {
    if (inflightProfilePromise) {
      return inflightProfilePromise;
    }

    inflightProfilePromise = (async () => {
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return null;
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!profileError && profile) {
          const loadedUser = profile as User;
          set({ user: loadedUser, isAuthenticated: true, isLoading: false });
          return loadedUser;
        }

        const meta = (authUser.user_metadata ?? {}) as Record<string, any>;
        const fallbackProfile = {
          id: authUser.id,
          email: (authUser.email || '').toLowerCase(),
          phone: meta.phone ? String(meta.phone).replace(/\D/g, '') || null : null,
          nome_completo: meta.nome_completo || authUser.email?.split('@')[0] || 'Cidadão',
          cep: meta.cep || '00000-000',
          bairro: meta.bairro || 'Centro',
          cidade: meta.cidade || 'São José dos Campos',
          estado: String(meta.estado || 'SP').toUpperCase().slice(0, 2),
        };

        const { data: created } = await supabase
          .from('users')
          .insert(fallbackProfile)
          .select('*')
          .maybeSingle();

        if (created) {
          const createdUser = created as User;
          set({ user: createdUser, isAuthenticated: true, isLoading: false });
          return createdUser;
        }

        const transientUser: User = {
          ...fallbackProfile,
          avatar_url: null,
          coordenadas: null,
          nivel_verificacao: 1,
          role: 'cidadao',
          cpf_hash: null,
          created_at: authUser.created_at,
        };
        set({ user: transientUser, isAuthenticated: true, isLoading: false });
        return transientUser;
      } catch (err) {
        console.warn('Falha ao carregar sessão do usuário:', err);
        set({ user: null, isAuthenticated: false, isLoading: false });
        return null;
      } finally {
        inflightProfilePromise = null;
      }
    })();

    return inflightProfilePromise;
  },

  login: async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { ok: false, error: 'Informe e-mail e senha.' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error.message) };
    }

    await get().refreshProfile();
    return { ok: true };
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Erro ao encerrar sessão no Supabase:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('conectabr_user_votes');
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
