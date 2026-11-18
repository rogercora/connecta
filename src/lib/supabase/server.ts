import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://fjtbdoeahdtellzbxpsy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_3TfAipTG33KDBTbsgzP9oQ_aDipKcny';

function cleanEnvValue(value: string | undefined): string {
  return (value || '').trim().replace(/^["']|["']$/g, '');
}

function getPublicSupabaseEnv() {
  const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey =
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY;
  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Cliente Supabase autenticado via cookies da requisição atual (SSR / Route Handlers).
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Chamado a partir de Server Component onde headers não são mutáveis; o middleware faz o refresh.
        }
      },
    },
  });
}

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Cliente privilegiado (service_role). Nunca faz fallback para anon key.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient;

  const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
  const serviceRoleKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ausente nas variáveis de ambiente do servidor.'
    );
  }

  cachedAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedAdminClient;
}
