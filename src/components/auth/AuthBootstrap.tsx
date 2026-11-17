'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function AuthBootstrap() {
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  useEffect(() => {
    void refreshProfile();

    let unsubscribe: (() => void) | undefined;

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') {
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          queryClient.clear();
          return;
        }

        if (event === 'SIGNED_IN') {
          const currentId = useAuthStore.getState().user?.id;
          if (currentId && session?.user?.id === currentId) {
            return;
          }
          void refreshProfile();
          return;
        }

        if (event === 'USER_UPDATED') {
          void refreshProfile();
        }
      });

      unsubscribe = () => subscription.unsubscribe();
    } catch (err) {
      console.warn('Falha ao inicializar listener de autenticação:', err);
      useAuthStore.getState().setLoading(false);
    }

    return () => {
      unsubscribe?.();
    };
  }, [refreshProfile, setUser, queryClient]);

  return null;
}
