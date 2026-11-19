import { NextResponse } from 'next/server';
import type { User as AuthUser } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';

export interface AuthGuardSuccess {
  ok: true;
  authUser: AuthUser;
  profile: User | null;
}

export interface AuthGuardFailure {
  ok: false;
  response: NextResponse;
}

export type AuthGuardResult = AuthGuardSuccess | AuthGuardFailure;

/**
 * Garante que a requisição pertence a um usuário autenticado via Supabase Auth.
 */
export async function requireAuthUser(): Promise<AuthGuardResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Não autenticado. Faça login para continuar.' },
        { status: 401 }
      ),
    };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return {
    ok: true,
    authUser: user,
    profile: (profile as User | null) ?? null,
  };
}

/**
 * Garante que a requisição pertence a um usuário autenticado com papel `admin`.
 */
export async function requireAdminUser(): Promise<AuthGuardResult> {
  const authResult = await requireAuthUser();
  if (!authResult.ok) return authResult;

  if (authResult.profile?.role !== 'admin' && authResult.profile?.role !== 'super_admin') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Acesso proibido: privilégio de administrador necessário.' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

export async function requireSuperAdminUser(): Promise<AuthGuardResult> {
  const authResult = await requireAuthUser();
  if (!authResult.ok) return authResult;

  if (authResult.profile?.role !== 'super_admin') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Acesso proibido: ação exclusiva do Super Admin.' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

