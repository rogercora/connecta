'use client';

import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setNivelVerificacao = useAuthStore((s) => s.setNivelVerificacao);

  return {
    user,
    isAuthenticated,
    isNivel1: (user?.nivel_verificacao ?? 0) >= 1,
    isNivel2: (user?.nivel_verificacao ?? 0) >= 2,
    login,
    logout,
    setNivelVerificacao,
  };
}

